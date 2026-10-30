import { axiosClient } from './api';
import { getAllCompanies, saveCompanies, CompanyTenant } from './companyService';

const CHAT_CONVERSATIONS_KEY = 'hrms_chat_conversations_records';
const CHAT_MESSAGES_KEY = 'hrms_chat_messages_records';
const SCHEDULE_STORAGE_KEY = 'hrms_work_schedule';
const INVOICES_STORAGE_PREFIX = 'hrms_subscription_invoices_';

export async function hydrateServerState(): Promise<void> {
  if (typeof window === 'undefined') return;

  const [companyResult, settingsResult, chatResult, planResult] = await Promise.allSettled([
    axiosClient.get('/companies/my-company'),
    axiosClient.get('/settings'),
    axiosClient.get('/chat/state'),
    axiosClient.get('/subscriptions/mine'),
  ]);

  if (companyResult.status === 'fulfilled' && companyResult.value.data?.id) {
    const company = companyResult.value.data;
    const name = company.companyName || company.name || '';
    if (name) localStorage.setItem('hrms_company_name', name);
    if (company.id) localStorage.setItem('hrms_company_id', company.id);
    if (company.companyCode) localStorage.setItem('hrms_company_code', company.companyCode);

    const existing = getAllCompanies();
    const tenant: CompanyTenant = {
      id: company.id,
      name,
      code: company.companyCode || '',
      industry: company.industry || 'General',
      plan: 'Starter',
      status: company.status === 'Inactive' ? 'Suspended' : 'Active',
      createdAt: company.createdAt || new Date().toISOString(),
      billingCycle: 'Monthly',
      maxEmployees: 25,
      contactEmail: company.email || '',
      contactPhone: company.phone || '',
      address: company.address || '',
      city: '',
      state: '',
      country: 'India',
      adminUser: {
        id: company.adminUserId || 'admin',
        fullName: 'Company Admin',
        email: company.email || '',
        phone: company.phone || '',
        designation: 'Administrator',
        role: 'HR_ADMIN',
      },
      departments: [],
    };
    const idx = existing.findIndex((item) => item.id === company.id);
    const next = [...existing];
    if (idx >= 0) next[idx] = { ...next[idx], ...tenant, plan: next[idx].plan, billingCycle: next[idx].billingCycle, maxEmployees: next[idx].maxEmployees };
    else next.push(tenant);
    saveCompanies(next);
    window.dispatchEvent(new Event('hrms_companies_updated'));
  }

  const companyId = localStorage.getItem('hrms_company_id') || '';

  if (settingsResult.status === 'fulfilled' && companyId && settingsResult.value.data?.workSchedule) {
    const schedule = {
      ...settingsResult.value.data.workSchedule,
      companyId,
    };
    localStorage.setItem(`${SCHEDULE_STORAGE_KEY}_${companyId}`, JSON.stringify(schedule));
    window.dispatchEvent(new CustomEvent('hrms_schedule_updated', { detail: { config: schedule, companyId } }));
  }

  if (chatResult.status === 'fulfilled' && chatResult.value.data) {
    const state = chatResult.value.data;
    const serverConversations = Array.isArray(state.conversations) ? state.conversations : [];
    const serverMessages = state.messages && typeof state.messages === 'object' ? state.messages : {};
    if (serverConversations.length > 0 || Object.keys(serverMessages).length > 0) {
      localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(serverConversations));
      localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(serverMessages));
      window.dispatchEvent(new CustomEvent('hrms_chat_updated'));
    }
  }

  if (planResult.status === 'fulfilled' && planResult.value.data && companyId) {
    const plan = planResult.value.data;
    const companies = getAllCompanies();
    const updated = companies.map((item) =>
      item.id === companyId
        ? {
            ...item,
            plan: plan.plan || item.plan,
            billingCycle: plan.billingCycle || item.billingCycle,
            maxEmployees: plan.maxEmployees || item.maxEmployees,
          }
        : item,
    );
    saveCompanies(updated);
    if (Array.isArray(plan.invoices)) {
      localStorage.setItem(`${INVOICES_STORAGE_PREFIX}${companyId}`, JSON.stringify(plan.invoices));
    }
  }
}
