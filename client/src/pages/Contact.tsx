// Orbital Workbench: explicit feedback delivery console with direct LinkedIn connection, same-origin endpoint, and Telegram alert relay.
import AppShell from "@/components/AppShell";
import { contactApiConfigured, submitContact } from "@/lib/contactApi";
import { sendContactNotification } from "@/lib/telegramAlerts";
import { useState } from "react";
import { Linkedin, Send, MessageSquare, ShieldCheck, Mail, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "Tool feedback", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setStatus("");

    // Dispatch directly to Telegram Bot if configured
    sendContactNotification({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      source: contactApiConfigured ? "Hostinger API + Web Form" : "Local Web Form",
    });

    if (!contactApiConfigured) {
      setSending(false);
      setStatus("Message dispatched! For guaranteed direct response, feel free to also reach out on LinkedIn.");
      return;
    }

    try {
      const response = await submitContact(form);
      setStatus(`Feedback received${response.requestId ? ` · ref ${response.requestId}` : ""}.`);
      setForm({ name: "", email: "", subject: "Tool feedback", message: "" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The feedback request could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const relayBody = [form.name && `Name: ${form.name}`, form.email && `Email: ${form.email}`, "", form.message]
    .filter(Boolean)
    .join("\n");
  const relayHref = `mailto:support@toolboxgalaxy.com?subject=${encodeURIComponent(form.subject || "Toolbox Galaxy feedback")}&body=${encodeURIComponent(relayBody)}`;

  return (
    <AppShell>
      <section className="page-section contact-page max-w-5xl mx-auto px-4 py-8">
        <p className="mono-label text-[#c7f36b]">CONTACT / DIRECT CHANNELS</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl font-semibold tracking-[-0.065em]">
          Let&apos;s build something great.
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-white/65">
          Have a question, partnership inquiry, or found a tool issue? Reach out directly via LinkedIn for instant chat, or dispatch a message below.
        </p>

        {/* Dual Channel Options Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Direct LinkedIn Connect */}
          <div className="md:col-span-1 rounded-2xl border border-[#0077b5]/40 bg-gradient-to-br from-[#0e1b2d] to-[#0a1220] p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0077b5]/20 text-[#00a0dc] border border-[#0077b5]/40 mb-4">
                <Linkedin size={26} />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#00a0dc]">
                FASTEST RESPONSE
              </span>
              <h2 className="font-display text-xl font-bold mt-1 text-white">
                Connect on LinkedIn
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed">
                Connect with <b>Mohd Aziz Shaikh</b> directly for collaborations, hiring inquiries, feedback, or custom development projects.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <a
                href="https://www.linkedin.com/in/mohdazizshaikh"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#0077b5] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-[#006097] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Linkedin size={16} />
                <span>Message on LinkedIn</span>
                <ArrowUpRight size={15} />
              </a>
              <span className="block mt-2 text-center text-[10px] text-white/40 font-mono">
                Verified Profile · Direct Messenger
              </span>
            </div>
          </div>

          {/* Card 2: Technical Message & Form Relay */}
          <div className="md:col-span-2 contact-panel rounded-2xl border border-white/10 bg-[#0e1628]/90 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c7f36b]">
                <MessageSquare size={16} />
                <span>FEEDBACK &amp; DISPATCH CONSOLE</span>
              </div>
              <span className="text-[11px] font-mono text-white/40">
                {contactApiConfigured ? "API LINKED" : "DIRECT DISPATCH"}
              </span>
            </div>

            <form onSubmit={send} className="contact-form space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-medium text-white/75">
                  Your Name
                  <input
                    required
                    maxLength={80}
                    value={form.name}
                    placeholder="e.g. Sarah Connor"
                    onChange={(event) => update("name", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#c7f36b] focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-white/75">
                  Your Email
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={form.email}
                    placeholder="you@domain.com"
                    onChange={(event) => update("email", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#c7f36b] focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-white/75">
                Subject
                <input
                  required
                  maxLength={140}
                  value={form.subject}
                  onChange={(event) => update("subject", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#c7f36b] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-medium text-white/75">
                Message / Tool Feedback
                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  value={form.message}
                  placeholder="Tell us what you loved, a bug you found, or a tool you'd like added..."
                  onChange={(event) => update("message", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#c7f36b] focus:outline-none"
                />
              </label>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c7f36b] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#090d18] shadow-md hover:bg-[#b5e358] transition-all disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>{sending ? "Sending…" : "Send Message"}</span>
                  </button>

                  <a
                    data-contact-relay
                    href={relayHref}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
                    title="Open your device default email client"
                  >
                    <Mail size={14} />
                    <span>Email App</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <ShieldCheck size={14} className="text-[#c7f36b]" />
                  <span>No spam · Safe dispatch</span>
                </div>
              </div>

              {status && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c7f36b]/30 bg-[#c7f36b]/10 p-3 text-xs text-[#c7f36b]" aria-live="polite">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{status}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
