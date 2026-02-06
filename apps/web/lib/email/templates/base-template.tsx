import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

const baseStyles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
  },
  header: {
    padding: '24px',
    backgroundColor: '#1e40af',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffffff',
    textDecoration: 'none',
  },
  section: {
    padding: '24px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '16px',
  },
  text: {
    fontSize: '16px',
    color: '#475569',
    lineHeight: '24px',
    marginBottom: '16px',
  },
  button: {
    backgroundColor: '#1e40af',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    marginTop: '16px',
    marginBottom: '16px',
  },
  footer: {
    padding: '24px',
    backgroundColor: '#f1f5f9',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '20px',
  },
  hr: {
    borderColor: '#e2e8f0',
    margin: '24px 0',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  badgeApproved: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeRejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '16px',
  },
  th: {
    padding: '12px',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#475569',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#475569',
  },
};

interface BaseTemplateProps {
  previewText: string;
  children: React.ReactNode;
}

export function BaseTemplate({ previewText, children }: BaseTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          {/* Header */}
          <Section style={baseStyles.header}>
            <Link href="https://otb.dafc.com" style={baseStyles.logo}>
              DAFC OTB Platform
            </Link>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section style={baseStyles.footer}>
            <Text style={baseStyles.footerText}>
              This email was sent from DAFC OTB Platform.
              <br />
              If you have any questions, please contact support@dafc.com
            </Text>
            <Text style={baseStyles.footerText}>
              &copy; {new Date().getFullYear()} DAFC. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { baseStyles };
