import { Section, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseTemplate, baseStyles } from './base-template';

interface WorkflowAssignedEmailProps {
  recipientName: string;
  workflowType: 'Budget' | 'OTB Plan' | 'SKU Proposal';
  itemName: string;
  submittedBy: string;
  submissionDate: string;
  dueDate?: string;
  stepName: string;
  actionRequired: string;
  viewUrl: string;
}

export function WorkflowAssignedEmail({
  recipientName,
  workflowType,
  itemName,
  submittedBy,
  submissionDate,
  dueDate,
  stepName,
  actionRequired,
  viewUrl,
}: WorkflowAssignedEmailProps) {
  return (
    <BaseTemplate previewText={`Action required: Review ${workflowType}`}>
      <Section style={baseStyles.section}>
        <Text style={baseStyles.heading}>Action Required</Text>

        <Text style={baseStyles.text}>Hi {recipientName},</Text>

        <Text style={baseStyles.text}>
          You have a new {workflowType.toLowerCase()} awaiting your review.
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
                <strong>Submitted By</strong>
              </td>
              <td style={baseStyles.td}>{submittedBy}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Submission Date</strong>
              </td>
              <td style={baseStyles.td}>{submissionDate}</td>
            </tr>
            {dueDate && (
              <tr>
                <td style={baseStyles.td}>
                  <strong>Due Date</strong>
                </td>
                <td style={{ ...baseStyles.td, color: '#dc2626', fontWeight: 'bold' }}>
                  {dueDate}
                </td>
              </tr>
            )}
            <tr>
              <td style={baseStyles.td}>
                <strong>Step</strong>
              </td>
              <td style={baseStyles.td}>{stepName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Action Required</strong>
              </td>
              <td style={baseStyles.td}>{actionRequired}</td>
            </tr>
          </tbody>
        </table>

        <Button href={viewUrl} style={baseStyles.button}>
          Review Now
        </Button>

        <Text style={baseStyles.text}>
          Please review this item and take appropriate action. If you have any
          questions, please contact the submitter directly.
        </Text>
      </Section>
    </BaseTemplate>
  );
}
