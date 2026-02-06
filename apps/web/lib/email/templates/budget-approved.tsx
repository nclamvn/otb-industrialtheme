import { Section, Text, Button, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseTemplate, baseStyles } from './base-template';

interface BudgetApprovedEmailProps {
  recipientName: string;
  budgetName: string;
  brandName: string;
  seasonName: string;
  totalAmount: string;
  approvedBy: string;
  approvalDate: string;
  comments?: string;
  viewUrl: string;
}

export function BudgetApprovedEmail({
  recipientName,
  budgetName,
  brandName,
  seasonName,
  totalAmount,
  approvedBy,
  approvalDate,
  comments,
  viewUrl,
}: BudgetApprovedEmailProps) {
  return (
    <BaseTemplate previewText={`Budget "${budgetName}" has been approved`}>
      <Section style={baseStyles.section}>
        <Text style={baseStyles.heading}>Budget Approved</Text>

        <Text style={baseStyles.text}>Hi {recipientName},</Text>

        <Text style={baseStyles.text}>
          Great news! Your budget allocation has been approved.
        </Text>

        <Hr style={baseStyles.hr} />

        <table style={baseStyles.table}>
          <tbody>
            <tr>
              <td style={baseStyles.td}>
                <strong>Budget</strong>
              </td>
              <td style={baseStyles.td}>{budgetName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Brand</strong>
              </td>
              <td style={baseStyles.td}>{brandName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Season</strong>
              </td>
              <td style={baseStyles.td}>{seasonName}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Total Amount</strong>
              </td>
              <td style={baseStyles.td}>{totalAmount}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Approved By</strong>
              </td>
              <td style={baseStyles.td}>{approvedBy}</td>
            </tr>
            <tr>
              <td style={baseStyles.td}>
                <strong>Approval Date</strong>
              </td>
              <td style={baseStyles.td}>{approvalDate}</td>
            </tr>
          </tbody>
        </table>

        {comments && (
          <>
            <Text style={baseStyles.text}>
              <strong>Comments:</strong>
            </Text>
            <Text style={{ ...baseStyles.text, fontStyle: 'italic' }}>
              &quot;{comments}&quot;
            </Text>
          </>
        )}

        <Button href={viewUrl} style={baseStyles.button}>
          View Budget Details
        </Button>

        <Text style={baseStyles.text}>
          You can now proceed with creating OTB plans for this budget.
        </Text>
      </Section>
    </BaseTemplate>
  );
}
