import {
  SESClient,
  SendEmailCommand,
  VerifyDomainIdentityCommand,
  GetIdentityVerificationAttributesCommand,
} from "@aws-sdk/client-ses";
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import prisma from "../db/db.js";
import dayjs from "dayjs";

export class DomainEmailService {
  constructor() {
    this.ses = new SESClient({ region: process.env.AWS_REGION });
    this.cw = new CloudWatchLogsClient({ region: process.env.AWS_REGION });
    this.logGroup = "/email-saas/dns-records";
  }

  // 8-day free trial check
  async startFreeTrial(userId) {
    const trialEnd = dayjs().add(8, "day").toDate();
    return prisma.subscription.create({
      data: {
        userId,
        plan: "FREE",
        startDate: new Date(),
        endDate: trialEnd,
        maxDomains: 2,
        maxMailboxes: 5,
        trialUsed: true,
      },
    });
  }

  // Domain setup: SES + CloudWatch record logging
  async setupDomain(domain, userId) {
    console.log("domain", domain, userId);
    const verify = await this.ses.send(
      new VerifyDomainIdentityCommand({ Domain: domain })
    );
    console.log("verify", verify);
    const token = verify.VerificationToken;

    await this.ensureCWStream(domain);
    await this.logDNSRecord(domain, {
      type: "TXT",
      name: `_amazonses.${domain}`,
      value: token,
    });

    const dbDomain = await prisma.domain.create({
      data: { name: domain, userId, verificationToken: token },
    });

    return {
      success: true,
      domain: dbDomain,
      dnsRecords: [{ name: `_amazonses.${domain}`, type: "TXT", value: token }],
    };
  }

  async ensureCWStream(domain) {
    const stream = domain.replace(/\./g, "-");
    try {
      await this.cw.send(
        new CreateLogGroupCommand({ logGroupName: this.logGroup })
      );
    } catch {}
    try {
      await this.cw.send(
        new CreateLogStreamCommand({
          logGroupName: this.logGroup,
          logStreamName: stream,
        })
      );
    } catch {}
  }

  async logDNSRecord(domain, record) {
    const stream = domain.replace(/\./g, "-");
    await this.cw.send(
      new PutLogEventsCommand({
        logGroupName: this.logGroup,
        logStreamName: stream,
        logEvents: [{ message: JSON.stringify(record), timestamp: Date.now() }],
      })
    );
  }

  async fetchDNSRecords(domain) {
    const stream = domain.replace(/\./g, "-");
    const logs = await this.cw.send(
      new GetLogEventsCommand({
        logGroupName: this.logGroup,
        logStreamName: stream,
        limit: 10,
      })
    );
    return logs.events.map((e) => JSON.parse(e.message));
  }

  // Check verification status with SES
  async verifyDomainInSES(domain) {
    const resp = await this.ses.send(
      new GetIdentityVerificationAttributesCommand({ Identities: [domain] })
    );
    const attr = resp.VerificationAttributes[domain];
    return attr?.VerificationStatus === "Success";
  }

  // Mailbox creation
  async createMailbox(domain, mailboxName, userId) {
    const email = `${mailboxName}@${domain}`;
    await prisma.mailbox.create({
      data: {
        emailAddress: email,
        userId,
        domainId: (
          await prisma.domain.findUnique({ where: { name: domain } })
        ).id,
      },
    });
    // optionally, verify email identity via SES here
    return { success: true, email };
  }

  // Send email
  async sendEmail(from, to, subject, html, text) {
    const cmd = new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html }, Text: { Data: text || subject } },
      },
    });
    return this.ses.send(cmd);
  }
}
