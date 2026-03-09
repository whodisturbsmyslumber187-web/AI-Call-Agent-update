import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Bot, GitFork, Users, Megaphone, BookOpen, PhoneCall, Route, ShieldAlert, Voicemail, Webhook, FlaskConical, LayoutDashboard, Activity, Monitor, Key, RefreshCw, Ban, DollarSign, Send, HelpCircle, MessageSquare } from "lucide-react";

const sections = [
  {
    id: "getting-started",
    icon: HelpCircle,
    title: "Getting Started",
    content: `**Welcome to AgentHub** — your AI-powered call center platform.

**Overview:**
This dashboard lets you create AI phone agents that answer calls, make outbound calls, run marketing campaigns, and manage customer relationships — all automatically.

**Quick Start:**
1. Go to **Businesses** and click **New Business** to create your first AI agent
2. Choose an industry template (Restaurant, Medical, Legal, etc.) or start custom
3. Configure the agent's personality, instructions, and knowledge base
4. Add phone numbers and assign them to your AI agent
5. Your agent is now live and ready to handle calls!

**Single-Admin Setup:** This platform is designed for you as the sole operator. All businesses you create are tied to your account.

**API Actions:** \`list_businesses\`, \`create_business\``,
  },
  {
    id: "businesses",
    icon: Building2,
    title: "Businesses",
    content: `**What it does:** Each "Business" is an independent AI agent with its own phone numbers, instructions, personality, and call history.

**How to use:**
1. Click **New Business** on the main page
2. Pick an industry template or start blank
3. Fill in the name and industry
4. The business is created with sensible defaults — customize from the detail page

**Key Settings:**
- **Agent Mode:** Receptionist, Sales Agent, or Support Agent — changes the AI's behavior profile
- **Status:** Active (taking calls) or Paused (not answering)
- **Timezone:** Affects time-based routing and analytics
- **Industry:** Helps the AI understand domain-specific terminology

**Tips:**
- Create separate businesses for different departments or locations
- Use the "Instructions" tab to give the agent detailed context about your business
- The agent will use the Knowledge Base to answer questions it hasn't been explicitly taught

**API Actions:** \`list_businesses\`, \`get_business\`, \`create_business\`, \`update_business\``,
  },
  {
    id: "agent-config",
    icon: Bot,
    title: "Agent Configuration",
    content: `**What it does:** Controls how your AI agent behaves on calls — its personality, voice, system prompt, and sales strategy.

**Tabs:**

**Instructions Tab:**
- Write the system prompt — this is the most important configuration
- Tell the agent what business it represents, how to handle common scenarios, and what to never say
- Example: "You are a receptionist for Dr. Smith's dental office. Always offer the next available appointment. Never discuss pricing over the phone."

**Personality Sliders:**
- **Friendliness** (1-10): How warm and casual vs. professional
- **Formality** (1-10): Casual language vs. corporate tone
- **Urgency** (1-10): Relaxed vs. time-sensitive approach
- **Humor** (1-10): Serious vs. light-hearted

**Sales Script Tab:**
- Write sales scripts the agent follows during outbound calls
- Add objection handling responses
- Set closing techniques and upsell prompts

**Tips:**
- Be specific in instructions — "If someone asks about pricing, say we start at $99/month" works better than "Be helpful about pricing"
- Test different personality settings with the A/B Experiments feature
- The agent combines instructions + knowledge base + sales script for its responses

**API Actions:** \`get_agent_config\`, \`update_agent_config\``,
  },
  {
    id: "ivr",
    icon: GitFork,
    title: "IVR Phone Trees",
    content: `**What it does:** Interactive Voice Response — "Press 1 for Sales, Press 2 for Support" phone trees that route callers before they reach an agent.

**Templates Available:**
- **Simple 2-Department:** Sales + Support
- **3-Department Standard:** Sales + Support + Billing
- **Full Office (5-dept):** Sales, Support, Billing, Manager, Operator
- **Medical Office:** Appointments, Pharmacy, Nurse, Billing, Emergency
- **Restaurant:** Reservations, Takeout, Catering, Manager
- **Legal Office:** Consultation, Case Status, Billing, Reception
- **Custom:** Start blank

**How to set up:**
1. Go to a business → **IVR Menu** tab
2. Click a template card to create an IVR menu
3. Edit the greeting text (what callers hear)
4. Configure each digit:
   - **Label**: "Sales", "Support", etc.
   - **Action**: AI Agent, Forward to Human, Voicemail, External Transfer
   - **Target Phone**: For human forwarding
   - **Caller ID Masking**: Hide caller's number from human agents
   - **Recording**: Toggle call recording per option
5. Enable IVR in the Providers tab

**Tips:**
- Keep menus short — 3-4 options max for best caller experience
- Always include a "Talk to a person" option
- Set appropriate timeout (how long to wait for a keypress) and max retries

**API Actions:** \`create_ivr_menu\`, \`update_ivr_menu\``,
  },
  {
    id: "phone-numbers",
    icon: Phone,
    title: "Phone Numbers & Caller ID Masking",
    content: `**What it does:** Manage phone numbers assigned to your businesses and control how calls are routed.

**Adding Numbers:**
1. Go to business → **Phone Numbers** tab
2. Click **Add Number**
3. Enter the phone number, provider (Twilio/Telnyx/Vonage), and provider SID
4. Set direction: Inbound, Outbound, or Both

**Assignment Types:**
- **AI Agent**: The AI handles the call directly
- **Human**: Forwards to a human operator's phone number
- **IVR Menu**: Routes through a phone tree first

**Caller ID Masking:**
When enabled, the caller's phone number is hidden from human agents receiving forwarded calls. Useful for:
- Privacy compliance
- Preventing agents from contacting customers directly
- HIPAA-compliant medical practices

**Call Recording:**
Toggle recording per number. Recordings are stored and accessible from Call Logs.

**Tips:**
- Use different numbers for different departments
- Label numbers clearly ("Main Line", "Sales Direct", etc.)
- Enable monitoring to see live call status for specific numbers

**API Actions:** \`list_phone_numbers\`, \`assign_number\``,
  },
  {
    id: "contacts",
    icon: Users,
    title: "Contacts & Segments",
    content: `**What it does:** Store and organize customer contact information for campaigns and call tracking.

**Managing Contacts:**
1. Go to business → **Contacts** tab
2. Add contacts individually or bulk import
3. Each contact has: Name, Phone, Email, Notes

**Contact Segments:**
Create filtered groups for targeted campaigns:
1. Go to **Contact Segments** tab
2. Create a segment with filter criteria (JSON-based)
3. Use segments to target specific groups in bulk calling campaigns

**Tips:**
- Keep phone numbers in E.164 format (+1XXXXXXXXXX)
- Use notes to track customer preferences and history
- Segments help you avoid calling the same people for different campaigns

**API Actions:** \`list_contacts\`, \`create_contact\`, \`import_contacts\``,
  },
  {
    id: "campaigns",
    icon: Megaphone,
    title: "Campaigns & Bulk Calling",
    content: `**What it does:** Create and manage outbound calling campaigns where the AI agent calls a list of contacts.

**Creating a Campaign:**
1. Go to business → **Campaigns** tab
2. Click **New Campaign**
3. Set a name and call script
4. Add contacts from your contact list
5. Configure calls per minute and concurrency limits

**Bulk Calling:**
The **Bulk Calling** tab lets you run high-volume outbound jobs:
1. Create a job with a name and select contacts
2. Set rate limits (calls per minute) and concurrency
3. Start the job — the system processes contacts automatically
4. Monitor progress in real-time: completed, failed, in-progress counts
5. Pause or cancel at any time

**Job Types:**
- **Outbound**: Standard AI-powered outbound calls
- **Follow-up**: Re-contact leads from previous campaigns
- **Survey**: Automated survey calls

**Tips:**
- Start with low concurrency (2-3) to test scripts before scaling up
- Check the DNC list before launching campaigns
- Use call dispositions to track outcomes and plan follow-ups
- Monitor the first few calls live to ensure quality

**API Actions:** \`list_campaigns\`, \`create_campaign\`, \`start_bulk_call\`, \`get_job_status\`, \`pause_job\`, \`cancel_job\``,
  },
  {
    id: "marketing",
    icon: Send,
    title: "Marketing Techniques (RVM/SMS/One-Ring/Press-1)",
    content: `**What it does:** Advanced marketing outreach methods beyond standard calling.

**RVM (Ringless Voicemail):**
Drop a voicemail directly into a contact's inbox without their phone ringing.
- Upload or specify an audio message
- Set a callback number for returns
- Great for appointment reminders and special offers

**Bulk SMS:**
Send text messages to contact lists.
- Write your message content
- Set a caller ID number
- Track delivery status per contact

**One-Ring Callback:**
Call a number, let it ring once, then hang up — prompting a callback.
- Set the ring count (1-2 rings)
- The callback number routes to your AI agent
- Effective for lead generation

**Press-1 Campaign:**
Call contacts with a recorded message, then transfer to a live agent when they press 1.
- Record your pitch message
- Set the transfer destination
- Track engagement rates

**Speed-to-Lead:**
Instantly call new leads as they come in.
- Configure webhook triggers
- AI calls the lead within seconds of form submission

**Tips:**
- Always comply with TCPA and local telemarketing regulations
- Use the DNC list to exclude opted-out numbers
- Test with small batches before large campaigns
- Schedule campaigns during business hours for best response rates

**API Actions:** \`start_marketing_job\`, \`get_job_status\`, \`pause_job\`, \`cancel_job\``,
  },
  {
    id: "knowledge-base",
    icon: BookOpen,
    title: "Knowledge Base",
    content: `**What it does:** Upload documents and information that your AI agent can reference during calls.

**How to use:**
1. Go to business → **Knowledge Base** tab
2. Click **Add Item** and enter a title + content
3. Or upload files (PDF, TXT, DOCX) — the agent will extract and use the content

**What to include:**
- FAQ answers
- Product/service details and pricing
- Business hours and location information
- Policies (returns, cancellations, etc.)
- Staff bios and specialties
- Menu items (for restaurants)

**Tips:**
- Organize by topic — create separate items for "Pricing", "Hours", "Services", etc.
- Be specific and factual — the agent uses this as its source of truth
- Update regularly when information changes
- The agent combines knowledge base + instructions to form responses

**API Actions:** Use \`update_business\` with \`knowledge_base\` field for the main text, or manage items via the UI.`,
  },
  {
    id: "call-logs",
    icon: PhoneCall,
    title: "Call Logs & Summaries",
    content: `**What it does:** View complete history of all calls handled by your AI agents.

**Call Logs Tab:**
- See every call: date, duration, caller number, direction, outcome
- Listen to recordings (if enabled)
- Read full transcripts
- Filter by direction (inbound/outbound) and date range

**Call Summaries Tab:**
- AI-generated summaries of each call
- Key topics discussed
- Action items extracted automatically
- Great for quick review without reading full transcripts

**Call Dispositions Tab:**
- Tag calls with outcomes: Completed, Appointment Set, Follow-up Needed, etc.
- Add notes and schedule next actions
- Track conversion rates across campaigns

**Tips:**
- Review summaries daily to catch issues early
- Use dispositions to build a follow-up pipeline
- Check transcripts when the AI handles an unusual scenario — use insights to improve instructions

**API Actions:** \`list_call_logs\`, \`list_call_summaries\`, \`get_call_transcript\``,
  },
  {
    id: "routing",
    icon: Route,
    title: "Routing Rules",
    content: `**What it does:** Define rules that control how incoming calls are routed based on conditions.

**Rule Types:**
- **Time-based**: Route differently during/after business hours
- **Caller ID**: Route VIP numbers to specific handlers
- **Day of week**: Different routing on weekends
- **Language**: Route based on detected language

**How to set up:**
1. Go to business → **Routing** tab
2. Click **Add Rule**
3. Set condition type, condition value, action, and target
4. Set priority (lower number = higher priority)
5. Toggle active/inactive

**Tips:**
- Always have a fallback rule for unmatched conditions
- Use time-based routing to send after-hours calls to voicemail
- Combine with IVR for sophisticated call flows`,
  },
  {
    id: "sla",
    icon: ShieldAlert,
    title: "SLA Rules",
    content: `**What it does:** Set Service Level Agreement targets and get alerts when they're at risk.

**How to use:**
1. Go to business → **SLA Rules** tab
2. Create rules for metrics like:
   - Max wait time in queue
   - Max ring time before answer
   - Response time targets
3. Set thresholds and alert actions

**Alerts appear in:**
- Command Center SLA banner
- Activity log
- Webhook notifications (if configured)

**Tips:**
- Start with reasonable targets and tighten over time
- Use the Command Center to monitor SLA compliance in real-time
- Configure webhooks to get instant Slack/email alerts on SLA breaches`,
  },
  {
    id: "voicemail",
    icon: Voicemail,
    title: "Voicemail",
    content: `**What it does:** Handle calls that go to voicemail — either when the agent is unavailable or as a deliberate routing option.

**Settings:**
- Custom voicemail greeting
- Notification preferences
- Transcription (AI automatically transcribes voicemail messages)
- Auto-follow-up settings

**Tips:**
- Keep voicemail greetings short (under 20 seconds)
- Enable transcription to quickly scan messages
- Set up auto-callbacks for important voicemails`,
  },
  {
    id: "webhooks",
    icon: Webhook,
    title: "Webhooks",
    content: `**What it does:** Send real-time notifications to external systems when events occur.

**Supported Events:**
- Call started / ended
- New voicemail
- Appointment booked
- SLA breach
- Campaign completed
- Approval needed

**How to set up:**
1. Go to business → **Webhooks** tab
2. Click **Add Webhook**
3. Enter the destination URL
4. Select which events to trigger on
5. Test with a sample payload

**Tips:**
- Use webhooks to connect with CRMs (Salesforce, HubSpot)
- Set up Slack notifications for important events
- Always verify webhook signatures in production
- Use the test button to verify your endpoint before going live`,
  },
  {
    id: "experiments",
    icon: FlaskConical,
    title: "A/B Experiments",
    content: `**What it does:** Test different agent configurations to find what works best.

**How to use:**
1. Go to business → **Experiments** tab
2. Create a new experiment with a name
3. Write two different instruction sets (Variant A and Variant B)
4. Set the traffic split (e.g., 50/50)
5. Start the experiment
6. Monitor results — the system tracks performance metrics for each variant
7. Pick a winner and apply it

**What you can test:**
- Different greeting styles
- Formal vs. casual tone
- Different sales pitches
- Upsell strategies
- Objection handling approaches

**Tips:**
- Test one variable at a time for clear results
- Run experiments for at least a week to get meaningful data
- Use call scores and customer satisfaction metrics to judge winners`,
  },
  {
    id: "command-center",
    icon: LayoutDashboard,
    title: "Command Center",
    content: `**What it does:** Real-time operational dashboard showing the health of your entire call center at a glance.

**Widgets:**
- **Revenue**: Track revenue attributed to AI calls
- **Leaderboard**: Compare performance across businesses/agents
- **Predictive Analytics**: AI-generated insights and forecasts
- **SLA Alerts**: Live alerts for SLA breaches

**Tips:**
- Check the Command Center at the start of each day
- Use predictive analytics to plan staffing and campaign timing
- Customize your layout preferences in Settings`,
  },
  {
    id: "agent-hub",
    icon: Users,
    title: "Agent Hub",
    content: `**What it does:** Multi-agent collaboration — your AI agents can communicate and transfer context between each other.

**Features:**
- Agent-to-agent messaging
- Context transfer during call handoffs
- Shared learnings across agents
- Broadcast messages to all agents

**How to use:**
1. Go to **Agent Hub** from the sidebar
2. View all your business agents and their status
3. Send messages between agents
4. Configure collaboration rules

**Tips:**
- Use agent collaboration when a caller needs to be transferred between departments
- Shared learnings help newer agents benefit from established agent knowledge
- Broadcast important policy changes to all agents at once`,
  },
  {
    id: "live-monitoring",
    icon: Monitor,
    title: "Live Monitoring",
    content: `**What it does:** Watch active calls in real-time — see what your AI is saying and how callers are responding.

**Features:**
- Live call list with duration, caller info, and status
- Real-time transcript streaming
- Queue monitoring
- Intervention options (coming soon)

**How to use:**
1. Go to **Live Monitor** from the sidebar
2. Active calls appear automatically
3. Click a call to see the live transcript
4. Monitor queue depth and wait times

**Tips:**
- Monitor the first calls of a new campaign to catch issues
- Watch for patterns in caller confusion — update instructions accordingly
- Use live monitoring during peak hours to ensure quality`,
  },
  {
    id: "api-keys",
    icon: Key,
    title: "API Keys & Dashboard Control API",
    content: `**What it does:** Create API keys that let external agents (OpenClaw, custom bots, etc.) control your entire dashboard programmatically.

**Creating an API Key:**
1. Go to **Settings** → **API Keys** section
2. Click **Create API Key**
3. Name it (e.g., "OpenClaw Agent")
4. Copy the key immediately — it's only shown once!
5. The key starts with \`ak_\` prefix

**Using the Dashboard API:**
Send POST requests to your backend function:
\`\`\`
POST /functions/v1/dashboard-api
Authorization: Bearer ak_your_key_here
Content-Type: application/json

{
  "action": "list_businesses"
}
\`\`\`

**Available Actions:**
- **Businesses**: list, get, create, update
- **Phone/IVR**: list numbers, create/update IVR menus, assign numbers
- **Contacts**: list, create, bulk import
- **Campaigns**: list, create, start bulk calls, start marketing jobs
- **Jobs**: get status, pause, cancel
- **Calls**: list logs, get summaries, get transcripts
- **Config**: get/update agent config, update providers
- **Monitoring**: dashboard stats, analytics
- **Help**: returns full API documentation as JSON

**Self-Discovery:**
Your agent can call \`{ "action": "help" }\` to get the complete API reference with all actions, parameters, and descriptions.

**Security:**
- Keys are hashed (SHA-256) — we never store the raw key
- Toggle keys active/inactive without deleting
- Rate limiting: default 100 requests/minute
- Each key tracks last used timestamp

**Tips:**
- Create separate keys for different agents/integrations
- Disable keys you're not using
- Use the \`help\` action first when connecting a new agent — it returns the full API schema
- Monitor API key usage via the last_used_at timestamp`,
  },
  {
    id: "provider-failover",
    icon: RefreshCw,
    title: "Provider Failover",
    content: `**What it does:** Configure backup LLM/TTS/STT providers that automatically take over if the primary provider fails.

**How to set up:**
1. Go to business → **Provider Failover** tab
2. Add failover entries with:
   - Provider type (LLM, TTS, STT)
   - Primary and fallback provider names
   - Priority order
3. Enable auto-failover

**Tips:**
- Always have at least one failover configured for production
- Test failover by temporarily disabling the primary
- Different providers have different latency — test before deploying`,
  },
  {
    id: "dnc",
    icon: Ban,
    title: "DNC (Do Not Call) List",
    content: `**What it does:** Maintain a list of phone numbers that should never be called by outbound campaigns.

**How to use:**
1. Go to business → **DNC List** tab
2. Add numbers individually or bulk import
3. Include a reason for each entry
4. The system automatically checks DNC before dialing

**Tips:**
- Always honor opt-out requests immediately
- Import existing DNC lists when setting up
- The system cross-references DNC on every outbound call
- Keep records of when and why numbers were added (compliance)`,
  },
  {
    id: "revenue",
    icon: DollarSign,
    title: "Revenue Tracking",
    content: `**What it does:** Track revenue generated by AI agent interactions.

**Features:**
- Revenue attribution per business/agent
- Conversion tracking from calls to sales
- Period-over-period comparisons
- Revenue forecasting (in Command Center)

**Tips:**
- Tag calls with revenue amounts via dispositions
- Use the Command Center revenue widget for quick overview
- Compare revenue across different agent configurations during A/B tests`,
  },
  {
    id: "telegram",
    icon: MessageSquare,
    title: "Telegram Bot Integration",
    content: `**What it does:** Connect a Telegram bot to receive notifications and send commands to your agents.

**Setup:**
1. Go to **Settings** → **Telegram** section
2. Enter your Telegram Bot Token (from @BotFather)
3. Configure which notifications to receive:
   - New calls
   - Voicemails
   - SLA alerts
   - Daily summaries

**Tips:**
- Use Telegram for mobile monitoring when away from the dashboard
- Set up group chats for team notifications
- The bot can send you call summaries in real-time`,
  },
  {
    id: "learnings",
    icon: BookOpen,
    title: "Agent Memory & Learnings",
    content: `**What it does:** The AI agent learns from past interactions and stores reusable responses.

**How it works:**
1. After calls, the system extracts learnings (FAQ patterns, successful responses)
2. Learnings appear in the **Agent Memory** tab
3. Review and approve/reject each learning
4. Approved learnings become part of the agent's knowledge

**Categories:**
- **FAQ**: Common questions and answers
- **Objection**: Successful objection handling responses
- **Upsell**: Effective upselling techniques
- **Policy**: Policy clarifications from real calls

**Tips:**
- Review learnings weekly to maintain quality
- Reject any incorrect or inappropriate learnings
- High-confidence learnings (>0.8) are usually safe to approve
- Use learnings to continuously improve your agent without manual instruction updates`,
  },
];

const HelpCenter = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Help & Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Complete guide to every feature in the platform. Your external agents can also access this via the Dashboard API's <code className="text-xs bg-muted px-1.5 py-0.5 rounded">help</code> action.
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Quick Start for Agent Integration</p>
              <p className="text-sm text-muted-foreground mt-1">
                1. Create an API key in <strong>Settings → API Keys</strong><br />
                2. Send a POST to <code className="text-xs bg-muted px-1 py-0.5 rounded">/functions/v1/dashboard-api</code> with <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer ak_xxx</code><br />
                3. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{"action": "help"}`}</code> to get the full API reference
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-2">
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id} className="border border-border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="text-base font-semibold text-foreground">{s.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">
                {s.content.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/).map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**"))
                    return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
                  if (part.startsWith("`") && part.endsWith("`"))
                    return <code key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>;
                  if (part === "\n") return <br key={i} />;
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Badge variant="outline">API Reference</Badge>
            All Dashboard API Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { cat: "Businesses", actions: ["list_businesses", "get_business", "create_business", "update_business"] },
              { cat: "Phone/IVR", actions: ["list_phone_numbers", "create_ivr_menu", "update_ivr_menu", "assign_number"] },
              { cat: "Contacts", actions: ["list_contacts", "create_contact", "import_contacts"] },
              { cat: "Campaigns", actions: ["list_campaigns", "create_campaign", "start_bulk_call", "start_marketing_job"] },
              { cat: "Jobs", actions: ["get_job_status", "pause_job", "cancel_job"] },
              { cat: "Calls", actions: ["list_call_logs", "list_call_summaries", "get_call_transcript"] },
              { cat: "Config", actions: ["get_agent_config", "update_agent_config", "update_providers"] },
              { cat: "Monitoring", actions: ["get_dashboard_stats", "get_analytics", "help"] },
            ].map((g) => (
              <div key={g.cat} className="space-y-1">
                <p className="font-semibold text-foreground">{g.cat}</p>
                {g.actions.map((a) => (
                  <code key={a} className="block text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">{a}</code>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpCenter;
