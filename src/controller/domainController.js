import { DomainEmailService } from "../aws/domainEmailService.js";
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
  const records = await svc.fetchDNSRecords(req.params.domain);
  res.json({ success: true, dnsRecords: records });
};

export const verifyDomain = async (req, res) => {
  const ok = await svc.verifyDomainInSES(req.params.domain);
  if (ok)
    await prisma.domain.update({
      where: { name: req.params.domain },
      data: { status: "VERIFIED" },
    });
  res.json({ success: ok, verified: ok });
};

export const createMailbox = async (req, res) => {
  const { domain, mailbox } = req.body;
  const result = await svc.createMailbox(domain, mailbox, req.user.id);
  res.json(result);
};

export const sendTestEmail = async (req, res) => {
  const { from, to, subject, html } = req.body;
  const result = await svc.sendEmail(from, to, subject, html);
  res.json({ success: true, messageId: result.MessageId });
};
