import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

export const maxDuration = 60; // Allow longer execution time for Local AI

export async function POST(req: Request) {
  try {
    const { url, prompt, submissionId } = await req.json();

    if (!url || !prompt || !submissionId) {
      return NextResponse.json({ error: 'Missing url, prompt or submissionId' }, { status: 400 });
    }

    // E1: SSRF Protection
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.')
    ) {
      return NextResponse.json({ error: 'Local network URLs are not allowed for evaluation.' }, { status: 403 });
    }

    // Step 1: Scrape Website Content
    let rawText = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s fetch timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      
      // Use Cheerio to extract main content
      const $ = cheerio.load(html);
      
      // Remove unwanted tags
      $('script, style, nav, footer, header, noscript, iframe, svg, path, symbol').remove();
      
      // Try to get article first, fallback to body
      let content = $('article').text();
      if (!content.trim()) {
        content = $('body').text();
      }
      
      // Clean up whitespace and limit length
      rawText = content.replace(/\s+/g, ' ').trim().slice(0, 15000); // Limit to 15000 chars

    } catch (scrapeError: any) {
      console.error('Scraping error:', scrapeError);
      return NextResponse.json({ error: `Failed to read document: ${scrapeError.message}` }, { status: 400 });
    }

    // Step 2: Call Local AI
    const openai = new OpenAI({
      baseURL: process.env.LOCAL_AI_URL || 'http://127.0.0.1:1234/v1',
      apiKey: 'local-ai-key', // LM Studio accepts dummy keys
    });

    // Construct the prompt instructing JSON output
    const systemInstruction = `You are a strict, helpful Document Review AI. Your job is to read a document and evaluate it against a set of criteria.
You MUST output your response purely as a valid JSON object in the following format:
{
  "status": "PASS" | "FAIL",
  "comment": "Your detailed reasoning here."
}`;

    const userMessage = `
--- TIÊU CHÍ ĐÁNH GIÁ ---
${prompt}

--- NỘI DUNG TÀI LIỆU ---
${rawText}
    `;

    const chatCompletion = await openai.chat.completions.create({
      model: 'local-model', // LM Studio usually ignores this unless strictly enforced
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' } // Help enforce JSON if supported
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || '{}';
    let feedbackJson;
    try {
      feedbackJson = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback if AI didn't return valid JSON
      feedbackJson = { status: 'UNKNOWN', comment: aiResponse };
    }

    // Step 3: Save to DB
    const { error: updateError } = await supabase
      .from('task_submissions')
      .update({ ai_feedback: feedbackJson })
      .eq('id', submissionId);

    if (updateError) {
      console.error('DB Update Error:', updateError);
    }

    return NextResponse.json({ success: true, feedback: feedbackJson });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
