interface TeamsNotificationPayload {
  title: string
  message: string
  encouragement: string
  scheduleId: string
}

function buildAdaptiveCard(payload: TeamsNotificationPayload) {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `📅 ${payload.title}`,
              weight: 'Bolder',
              size: 'Medium',
            },
            {
              type: 'TextBlock',
              text: payload.message,
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: payload.encouragement,
              wrap: true,
              color: 'Accent',
              spacing: 'Small',
            },
          ],
        },
      },
    ],
  }
}

export async function sendTeamsNotification(
  webhookUrl: string,
  payload: TeamsNotificationPayload,
  maxRetries = 3
): Promise<boolean> {
  if (!webhookUrl) return false

  const body = JSON.stringify(buildAdaptiveCard(payload))

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (res.ok) return true

      if (attempt === maxRetries) return false
    } catch {
      if (attempt === maxRetries) return false
    }
  }

  return false
}
