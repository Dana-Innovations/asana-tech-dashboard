import { NextRequest, NextResponse } from 'next/server';

const ASANA_TOKEN = process.env.NEXT_PUBLIC_ASANA_TOKEN;
const FEEDBACK_PROJECT_ID = '1213826126933603'; // (APP) Asana TI Dashboard project

export async function POST(request: NextRequest) {
  try {
    const { type, title, description, priority, email, timestamp, url } = await request.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!ASANA_TOKEN) {
      return NextResponse.json(
        { error: 'Asana token not configured' },
        { status: 500 }
      );
    }

    // Create task in Asana
    const typeEmoji = type === 'bug' ? '🐛' : type === 'feature' ? '💡' : '💬';
    const typeLabel = type === 'bug' ? 'Bug' : type === 'feature' ? 'Feature Request' : 'Feedback';
    
    const taskData = {
      data: {
        name: `${typeEmoji} [${typeLabel}] ${title}`,
        notes: `**${typeLabel} Submission from TI Dashboard**

**Type:** ${typeLabel}
**Priority:** ${priority.charAt(0).toUpperCase() + priority.slice(1)}
**Title:** ${title}

**Description:**
${description}

**Submission Details:**
- Email: ${email || 'Not provided'}
- Submitted: ${new Date(timestamp).toLocaleString()}
- URL: ${url}
- Source: Technology Project Dashboard

**Next Steps:**
${type === 'bug' ? 
  '- [ ] Reproduce the issue\n- [ ] Identify root cause\n- [ ] Implement fix\n- [ ] Test and verify' :
  type === 'feature' ?
  '- [ ] Review feasibility\n- [ ] Prioritize against roadmap\n- [ ] Plan implementation\n- [ ] Design and develop' :
  '- [ ] Review feedback\n- [ ] Determine appropriate action\n- [ ] Follow up if needed'
}`,
        projects: [FEEDBACK_PROJECT_ID],
        completed: false,
      }
    };

    const response = await fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASANA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Asana API Error:', errorData);
      throw new Error(`Asana API responded with ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({ 
      success: true,
      taskId: result.data.gid,
      message: 'Feedback submitted successfully' 
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}