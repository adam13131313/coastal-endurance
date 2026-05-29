/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface FieldTeamDiscountEmailProps {
  siteName: string
  discountCode: string
}

export const FieldTeamDiscountEmail = ({
  siteName,
  discountCode,
}: FieldTeamDiscountEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} field team discount code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>COASTAL ENDURANCE</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Your field team discount</Heading>
        <Text style={text}>
          Thanks for being part of the Coastal Endurance field team. Here's your
          personal discount code — apply it at checkout.
        </Text>
        <Section style={codeBox}>
          <Text style={code}>{discountCode}</Text>
        </Section>
        <Text style={footer}>
          This code is for approved field team members only. If you didn't request
          it, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default FieldTeamDiscountEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const header = { padding: '0 0 8px' }
const brand = {
  fontSize: '13px',
  fontWeight: '600' as const,
  letterSpacing: '3px',
  color: '#000000',
  margin: '0',
}
const divider = { borderColor: '#d6cfc4', margin: '16px 0 28px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: '#000000',
  margin: '0 0 20px',
  letterSpacing: '-0.3px',
}
const text = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeBox = {
  border: '1px solid #d6cfc4',
  backgroundColor: '#f7f3ef',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const code = {
  fontSize: '26px',
  fontWeight: '600' as const,
  letterSpacing: '4px',
  color: '#000000',
  margin: '0',
}
const footer = { fontSize: '13px', color: '#999999', margin: '32px 0 0', lineHeight: '1.5' }
