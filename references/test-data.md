# Test Data for Form Filling

Use this fake but realistic data when filling contact forms. Do NOT submit any forms.

## Primary Contact

| Field | Value |
|---|---|
| First Name | Alex |
| Last Name | Morgan |
| Full Name | Alex Morgan |
| Email | alex.morgan@testbenchmark.example.com |
| Phone | +1 (555) 012-3456 |
| Company | Benchmark Testing Corp |
| Job Title | Product Manager |
| Website | https://testbenchmark.example.com |

## Address

| Field | Value |
|---|---|
| Address Line 1 | 742 Evergreen Terrace |
| Address Line 2 | Suite 400 |
| City | Springfield |
| State/Province | Illinois |
| ZIP/Postal Code | 62704 |
| Country | United States |

## Message Content

### Short message (for single-line or small textarea)

```
Hi, I'd like to learn more about your services and pricing. Could someone from your team reach out?
```

### Long message (for large textarea fields)

```
Hello,

I'm reaching out on behalf of Benchmark Testing Corp. We're currently evaluating solutions
in your space and would like to schedule a conversation with your team.

Specifically, we're interested in:
- Enterprise pricing and licensing
- Integration capabilities with our existing stack
- Support and SLA options

We have a team of approximately 50 users and are looking to make a decision within the
next quarter. Please let me know the best way to arrange a call.

Thank you for your time.

Best regards,
Alex Morgan
Product Manager, Benchmark Testing Corp
```

## Field-Type Mappings

Use these values based on the field type detected:

| Field Type | Value to Use |
|---|---|
| text (name) | Alex Morgan |
| email | alex.morgan@testbenchmark.example.com |
| tel / phone | +1 (555) 012-3456 |
| url / website | https://testbenchmark.example.com |
| textarea (short) | Short message above |
| textarea (long) | Long message above |
| select / dropdown | Pick the first non-placeholder option |
| checkbox | Check the first option (skip marketing opt-ins) |
| radio | Select the first option |
| file upload | Skip — note as friction point |
| number (employees) | 50 |
| number (budget) | 10000 |
| date | 2025-06-15 |

## Notes

- Use the `.example.com` domain to ensure no real email delivery
- Phone number uses 555 prefix (reserved for fictional use in US)
- If a field requires a specific format not covered above, adapt the closest match
- Never check "I agree to marketing emails" boxes — only check required consent boxes
