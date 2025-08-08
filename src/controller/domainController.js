import { DomainEmailService } from "../aws/domainEmailService.js";
import Prisma from "../db/db.js";
const svc = new DomainEmailService();

export const createDomain = async (req, res) => {
  if (!req.body.domain)
    return res.status(400).json({ error: "Domain required" });

  const result = await svc.setupDomain(req.body.domain, req.user.id);
  console.log("result", result);

  res.status(201).json(result);
};

export const getDNSRecords = async (req, res) => {
  console.log("req.params.domain", req.params.domain);
  if (!req.params.domain)
    return res.status(400).json({ error: "Domain required" });
  const domain = await Prisma.domain.findUnique({
    where: { id: req.params.domain },
  });
  if (!domain) return res.status(404).json({ error: "Domain not found" });
  console.log("domain", domain);

  const records = await svc.fetchDNSRecords(domain);
  res.json({ success: true, dnsRecords: records });
};

export const verifyDomain = async (req, res) => {
  if (!req.params.domain) {
    return res.status(400).json({ error: "Domain required" });
  }
  const domain = await Prisma.domain.findUnique({
    where: { id: req.params.domain },
  });
  if (!domain) return res.status(404).json({ error: "Domain not found" });

  const ok = await svc.verifyDomainInSES(domain.name);
  console.log("ok", ok);
  if (!ok) return res.status(400).json({ error: "Verification failed" });
  if (ok) {
    const updated = await Prisma.domain.update({
      where: { id: domain.id },
      data: { status: "VERIFIED" },
    });
    console.log("updated", updated);
  }
  res.json({ success: ok, verified: ok });
};

export const createMailbox = async (req, res) => {
  const { mailbox, password } = req.body;
  console.log(req.body);
  console.log("req.user", req.user);

  if (!mailbox || !password) {
    return res.status(400).json({ error: "Mailbox and password are required" });
  }
  try {
    const result = await svc.createMailbox(mailbox, password, req.user.id);
    res.json(result);
  } catch (err) {
    console.error("Create Mailbox Error:", err);
    res.status(500).json({ error: "Failed to create mailbox" });
  }
};

export const sendTestEmail = async (req, res) => {
  const { from, to, subject, html } = req.body;
  const result = await svc.sendEmail(from, to, subject, html);
  res.json({ success: true, messageId: result.MessageId });
};
