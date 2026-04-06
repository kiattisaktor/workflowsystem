import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- Helper: Read .env.local manually ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local file not found!');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) env[key.trim()] = value.join('=').trim();
    });
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const G_SCRIPT_URL = process.env.G_SCRIPT_URL;

if (!G_SCRIPT_URL) {
    console.error('ERROR: G_SCRIPT_URL is not set!');
    console.log('Usage: G_SCRIPT_URL="https://script.google.com/..." npx tsx scripts/reimport.ts');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

async function runReimport() {
    console.log('🚀 Starting Re-import Process...');

    // 1. Fetch data from Google Sheets
    console.log('📦 Fetching data from Google Sheets...');
    const response = await fetch(G_SCRIPT_URL as string, {
        method: 'POST',
        body: JSON.stringify({ action: 'getTasks' }),
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch from Sheets: ${response.statusText}`);
    }
    const allTasks: any[] = await response.json();
    console.log(`✅ Fetched ${allTasks.length} task rows.`);

    // 2. Clear existing data
    console.log('🗑️ Clearing existing data (Meetings, Subjects, Routing)...');
    // We only delete Meetings. Cascade will delete Subjects and Routing.
    const { error: deleteError } = await supabase.from('meetings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw deleteError;
    console.log('✅ Existing data cleared.');

    // 3. Process & Import
    // We need to group by Meeting, then by Subject
    const meetingsMap = new Map<string, any>();

    for (const row of allTasks) {
        // Create unique key for Meeting
        const meetingKey = `${row.sheet}|${row.work}|${row.meetingNo}|${row.remarkDate || ''}`;
        
        if (!meetingsMap.has(meetingKey)) {
            meetingsMap.set(meetingKey, {
                sheet: row.sheet,
                work: row.work,
                meetingNo: row.meetingNo,
                remarkDate: row.remarkDate,
                subjects: new Map<string, any>()
            });
        }

        const meeting = meetingsMap.get(meetingKey);
        const subjectKey = row.subject;

        if (!meeting.subjects.has(subjectKey)) {
            meeting.subjects.set(subjectKey, {
                subjectName: row.subject,
                ecm: row.ecm,
                note: row.note,
                urgent: row.urgent,
                dueDate: row.dueDate, // Note: Sheets format dd/MM/yyyy
                responsible: row.responsible,
                routing: []
            });
        }

        const subject = meeting.subjects.get(subjectKey);
        
        // --- Custom Date Parser for dd/mm/yyyy hh:mm:ss ---
        const parseThaiDate = (dateStr: string) => {
            if (!dateStr || String(dateStr).trim() === "") return null;
            
            // Match dd/mm/yyyy [hh:mm:ss]
            const parts = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
            if (!parts) {
                // Fallback for native parsing if it doesn't match dd/mm/yyyy exactly
                const native = new Date(dateStr);
                return isNaN(native.getTime()) ? null : native.toISOString();
            }

            const [_, day, month, year, hh, mi, ss] = parts;
            // JavaScript months are 0-indexed (Jan=0, Feb=1, etc.)
            const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hh || 0), Number(mi || 0), Number(ss || 0));
            return isNaN(d.getTime()) ? null : d.toISOString();
        };

        const finalTimestamp = parseThaiDate(row.timestamp);

        subject.routing.push({
            current_holder: row.currentHolder,
            status: row.status,
            assigned_to: row.assignedTo,
            remark: row.remark,
            order: row.order,
            task_timestamp: finalTimestamp
        });
    }

    console.log(`🏗️ Processing ${meetingsMap.size} meetings...`);

    for (const [mKey, mData] of meetingsMap.entries()) {
        // A. Insert Meeting
        const { data: newMeeting, error: mErr } = await supabase
            .from('meetings')
            .insert({
                sheet: mData.sheet,
                work: mData.work,
                meeting_no: mData.meetingNo,
                remark_date: mData.remarkDate
            }).select('id').single();
        
        if (mErr) {
            console.error(`Error inserting meeting ${mKey}:`, mErr);
            continue;
        }

        for (const [sKey, sData] of mData.subjects.entries()) {
            // B. Insert Subject
            const { data: newSubject, error: sErr } = await supabase
                .from('subjects')
                .insert({
                    meeting_id: newMeeting.id,
                    subject_name: sData.subjectName,
                    ecm: sData.ecm,
                    note: sData.note,
                    urgent: sData.urgent,
                    due_date: sData.dueDate,
                    responsible: sData.responsible
                }).select('id').single();

            if (sErr) {
                console.error(`Error inserting subject ${sKey}:`, sErr);
                continue;
            }

            // C. Insert Routing History
            // Sort routing by order to be safe
            const sortedRouting = sData.routing.sort((a: any, b: any) => a.order - b.order);
            const routingToInsert = sortedRouting.map((r: any) => ({
                subject_id: newSubject.id,
                ...r
            }));

            const { error: rErr } = await supabase.from('task_routing').insert(routingToInsert);
            if (rErr) {
                console.error(`Error inserting routing for ${sKey}:`, rErr);
            }
        }
        process.stdout.write('.');
    }

    console.log('\n✨ Re-import completed successfully!');
}

runReimport().catch(err => {
    console.error('❌ Re-import failed:', err);
    process.exit(1);
});
