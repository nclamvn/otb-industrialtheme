import { Section, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseTemplate, baseStyles } from './base-template';

interface SLAWarningEmailProps {
  recipientName: string;
  workflowType: 'Budget' | 'OTB Plan' | 'SKU Proposal';
  itemName: string;
  deadline: string;
  timeRemaining: string;
  stepName: string;
  viewUrl: string;
}

export function SLAWarningEmail({
  recipientName,
  workflowType,
  itemName,
  deadline,
  timeRemaining,
  stepName,
  viewUrl,
}: SLAWarningEmailProps) {
  return (
    <BaseTemplate previewText={`Urgent: SLA deadline approaching for ${itemName}`}>
      <Section style={baseStyles.section}>
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <Text
            style={{
              ...baseStyles.text,
              color: '#dc2626',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            SLA Deadline Approaching
          </Text>
          <Text style={{ ...baseStyles.text, color: '#dc2626', marginBottom: '0' }}>
            You have <strong>{timeRemaining}</strong> remaining to complete your action.
          </Text>
        </div>

        <Text style={baseStyles.text}>Hi {recipientName},</Text>

        <Text style={baseStyles.text}>
          This is a reminder that you have a pending approval that is approaching its
          SLA deadline.
        </Text>

        <Hr style={baseStyles.hr} />

        <table style={baseStyles.table}>
          <tbody>
            <tr>
              <td style={baseStyles.td}>
                <strong>Type</strong>
              </td>
              <td style={baseStyles.td}>{workflowType}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Name</strong>
              </td>
              <td style={baseStyles.td}>{itemName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Step</strong>
              </td>
              <td style={baseStyles.td}>{stepName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Deadline</strong>
              </td>
              <td style={{ ...baseStyles.td, color: '#dc2626', fontWeight: 'bold' }}>
                {deadline}
              </td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Time Remaining</strong>
              </td>
              <td style={{ ...baseStyles.td, color: '#dc2626', fontWeight: 'bold' }}>
                {timeRemaining}
              </td>
            </tr>
          </tbody>
        </table>

        <Button
          href={viewUrl}
          style={{
            ...baseStyles.button,
            backgroundColor: '#dc2626',
          }}
        >
          Take Action Now
        </Button>

        <Text style={baseStyles.text}>
          Please take action as soon as possible to avoid SLA breach. Missing
          deadlines may affect team performance metrics.
        </Text>
      </Section>
    </BaseTemplate>
  );
}
