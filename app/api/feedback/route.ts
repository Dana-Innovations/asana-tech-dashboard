import { NextRequest, NextResponse } from 'next/server';

const ASANA_TOKEN = process.env.NEXT_PUBLIC_ASANA_TOKEN;
const FEEDBACK_PROJECT_ID = '1213751150054021'; // (APP) Asana TI Dashboard project

export async function POST(request: NextRequest) {
  try {
    const { feedback, email, timestamp, url } = await request.json();

    if (!feedback?.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
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
    const taskData = {
      data: {
        name: `Feedback: ${feedback.slice(0, 50)}${feedback.length > 50 ? '...' : ''}`,
        notes: `**User Feedback Submission**

**Feedback:**
${feedback}

**Details:**
- Email: ${email || 'Not provided'}
- Timestamp: ${timestamp}
- URL: ${url}
- Source: TI Dashboard Feedback Button

**Next Steps:**
- Review feedback
- Determine priority and category
- Implement if appropriate`,
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