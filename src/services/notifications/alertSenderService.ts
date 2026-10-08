import { Employee, NotificationLog, Presence, Task, SalaryPayment } from '../../types';
import { sendEmailApi, sendWhatsappApi } from '../apiClient';
import { generateEmailHtml, generateWhatsappText, AlertData } from './notificationTemplates';

export async function sendLatenessAlert(
  employee: Employee,
  presence: Presence,
  thresholdTime: string
): Promise<NotificationLog[]> {
  const logs: NotificationLog[] = [];
  const alertData: AlertData = {
    employee,
    type: 'lateness',
    details: {
      date: presence.date,
      arrivalTime: presence.arrivalTime || 'N/A',
      thresholdTime,
    },
  };

  if (employee.email) {
    const html = generateEmailHtml(alertData);
    await sendEmailApi({
      to: employee.email,
      subject: `⚠️ Retard Enregistré - ${presence.date} [Citrine]`,
      html,
    });
    logs.push({
      id: `log-email-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.email,
      type: 'email',
      title: `Retard Enregistré - ${presence.date}`,
      content: `Email envoyé à ${employee.email}`,
      payload: JSON.stringify({ email: employee.email }),
      timestamp: new Date().toISOString(),
    });
  }

  if (employee.phone) {
    const message = generateWhatsappText(alertData);
    await sendWhatsappApi({ phone: employee.phone, message });
    logs.push({
      id: `log-wa-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.phone,
      type: 'whatsapp',
      title: `WhatsApp Retard - ${presence.date}`,
      content: `Message envoyé à ${employee.phone}`,
      payload: JSON.stringify({ phone: employee.phone }),
      timestamp: new Date().toISOString(),
    });
  }

  return logs;
}

export async function sendPriorityTaskAlert(
  employee: Employee,
  task: Task
): Promise<NotificationLog[]> {
  const logs: NotificationLog[] = [];
  const alertData: AlertData = {
    employee,
    type: 'priority_task',
    details: {
      taskTitle: task.title,
      taskDescription: task.description,
      taskDueDate: task.date,
      taskDueTime: task.time,
      taskPriority: task.priority,
    },
  };

  if (employee.email) {
    const html = generateEmailHtml(alertData);
    await sendEmailApi({
      to: employee.email,
      subject: `🚨 Tâche Prioritaire Assignée : ${task.title}`,
      html,
    });
    logs.push({
      id: `log-email-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.email,
      type: 'email',
      title: `Tâche Prioritaire : ${task.title}`,
      content: `Email envoyé à ${employee.email}`,
      payload: JSON.stringify({ email: employee.email }),
      timestamp: new Date().toISOString(),
    });
  }

  if (employee.phone) {
    const message = generateWhatsappText(alertData);
    await sendWhatsappApi({ phone: employee.phone, message });
    logs.push({
      id: `log-wa-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.phone,
      type: 'whatsapp',
      title: `WhatsApp Tâche : ${task.title}`,
      content: `Message envoyé à ${employee.phone}`,
      payload: JSON.stringify({ phone: employee.phone }),
      timestamp: new Date().toISOString(),
    });
  }

  return logs;
}

export async function sendPayslipAlert(
  employee: Employee,
  payment: SalaryPayment
): Promise<NotificationLog[]> {
  const logs: NotificationLog[] = [];
  const alertData: AlertData = {
    employee,
    type: 'payslip',
    details: {
      payslipPeriod: payment.period,
      payslipBaseAmount: payment.baseAmount,
      payslipBonusAmount: payment.bonusAmount,
      payslipAdvanceAmount: payment.advanceAmount,
      payslipNetAmount: payment.netAmount,
      payslipStatus: payment.status,
    },
  };

  if (employee.email) {
    const html = generateEmailHtml(alertData);
    await sendEmailApi({
      to: employee.email,
      subject: `💶 Fiche de Paie Disponible - Période ${payment.period}`,
      html,
    });
    logs.push({
      id: `log-email-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.email,
      type: 'email',
      title: `Fiche de Paie - ${payment.period}`,
      content: `Email envoyé à ${employee.email}`,
      payload: JSON.stringify({ email: employee.email }),
      timestamp: new Date().toISOString(),
    });
  }

  if (employee.phone) {
    const message = generateWhatsappText(alertData);
    await sendWhatsappApi({ phone: employee.phone, message });
    logs.push({
      id: `log-wa-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      recipient: employee.phone,
      type: 'whatsapp',
      title: `WhatsApp Paie - ${payment.period}`,
      content: `Message envoyé à ${employee.phone}`,
      payload: JSON.stringify({ phone: employee.phone }),
      timestamp: new Date().toISOString(),
    });
  }

  return logs;
}

export async function sendBatchedOfflineWhatsappNotifications(
  items: Array<NotificationLog | { phone?: string; recipient?: string; content?: string; message?: string }>
): Promise<boolean> {
  let allOk = true;
  for (const item of items) {
    try {
      const phone = (item as any).phone || (item as any).recipient;
      const message = (item as any).message || (item as any).content;
      if (phone && message) {
        const res = await sendWhatsappApi({ phone, message });
        if (!res.success) allOk = false;
      }
    } catch {
      allOk = false;
    }
  }
  return allOk;
}
