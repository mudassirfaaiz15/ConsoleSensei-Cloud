import { supabase, isDemoMode } from '@/lib/supabase';
import { handleApiError, AppError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { LRUCache } from '@/lib/utils/cache';
import { analytics } from '@/lib/utils/analytics';

// Cache for cost data (5 minute TTL)
const costCache = new LRUCache<CostData>(10, { ttl: 5 * 60 * 1000 });

// Types
export interface MonthlyCost {
    month: string;
    cost: number | null;
    forecast: number;
}

export interface ServiceCost {
    name: string;
    cost: number;
    change: number;
    color: string;
}

export interface ResourceCost {
    id: string;
    name: string;
    type: string;
    cost: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    alert?: string;
}

export interface CostRecommendation {
    id: string;
    title: string;
    description: string;
    savings: number;
    impact: 'low' | 'medium' | 'high';
}

export interface CostData {
    monthlyCosts: MonthlyCost[];
    serviceCosts: ServiceCost[];
    resourceCosts: ResourceCost[];
    recommendations: CostRecommendation[];
    totalCost: number;
    potentialSavings: number;
}

// Demo data
const DEMO_MONTHLY_COSTS: MonthlyCost[] = [
    { month: 'Aug', cost: 3200, forecast: 3200 },
    { month: 'Sep', cost: 3450, forecast: 3450 },
    { month: 'Oct', cost: 3100, forecast: 3100 },
    { month: 'Nov', cost: 3680, forecast: 3680 },
    { month: 'Dec', cost: 3890, forecast: 3890 },
    { month: 'Jan', cost: 3660, forecast: 3660 },
    { month: 'Feb', cost: null, forecast: 3800 },
];

const DEMO_SERVICE_COSTS: ServiceCost[] = [
    { name: 'EC2', cost: 1450, change: 5.2, color: '#6366f1' },
    { name: 'RDS', cost: 890, change: -2.1, color: '#22c55e' },
    { name: 'S3', cost: 420, change: 12.5, color: '#f59e0b' },
    { name: 'Lambda', cost: 380, change: -8.3, color: '#ec4899' },
    { name: 'CloudFront', cost: 280, change: 3.1, color: '#8b5cf6' },
    { name: 'Other', cost: 240, change: 0, color: '#64748b' },
];

const DEMO_RESOURCE_COSTS: ResourceCost[] = [
    { id: 'i-0abc123', name: 'prod-api-server', type: 'EC2', cost: 450.00, trend: 'up', change: 12 },
    { id: 'i-0def456', name: 'prod-web-server', type: 'EC2', cost: 380.00, trend: 'down', change: -5 },
    { id: 'db-prod-001', name: 'production-db', type: 'RDS', cost: 520.00, trend: 'up', change: 8 },
    { id: 'eip-123', name: 'unused-elastic-ip', type: 'EIP', cost: 3.60, trend: 'stable', change: 0, alert: 'Unused resource' },
];

const DEMO_RECOMMENDATIONS: CostRecommendation[] = [
    { id: 'rec-1', title: 'Delete unused Elastic IPs', description: '3 Elastic IPs are not attached', savings: 10.80, impact: 'low' },
    { id: 'rec-2', title: 'Right-size EC2 instances', description: '2 instances have low CPU utilization', savings: 180.00, impact: 'medium' },
    { id: 'rec-3', title: 'Use Reserved Instances', description: 'Save up to 40% on EC2', savings: 580.00, impact: 'high' },
];

// API Functions
export async function fetchCostData(): Promise<CostData> {
    try {
        // Check cache first
        const cacheKey = 'cost_data_all';
        const cached = costCache.get(cacheKey);
        if (cached) {
            logger.debug('Cost data retrieved from cache');
            return cached;
        }

        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const totalCost = DEMO_SERVICE_COSTS.reduce((sum, s) => sum + s.cost, 0);
            const potentialSavings = DEMO_RECOMMENDATIONS.reduce((sum, r) => sum + r.savings, 0);

            const result = {
                monthlyCosts: DEMO_MONTHLY_COSTS,
                serviceCosts: DEMO_SERVICE_COSTS,
                resourceCosts: DEMO_RESOURCE_COSTS,
                recommendations: DEMO_RECOMMENDATIONS,
                totalCost,
                potentialSavings,
            };
            
            costCache.set(cacheKey, result);
            analytics.trackEvent('cost_data_fetched', { source: 'demo' });
            return result;
        }

        const { data, error } = await supabase
            .from('cost_data')
            .select('*')
            .single();

        if (error) throw new AppError('Failed to fetch cost data', 'COST_FETCH_ERROR', 400, { originalError: error });
        
        costCache.set(cacheKey, data);
        logger.info('Cost data fetched successfully', { source: 'supabase' });
        analytics.trackEvent('cost_data_fetched', { source: 'supabase' });
        return data;
    } catch (error) {
        const appError = handleApiError(error);
        logger.error('Error fetching cost data', appError);
        analytics.trackError(appError);
        throw appError;
    }
}

export async function fetchCostTrends(months: number = 6): Promise<MonthlyCost[]> {
    try {
        const cacheKey = `cost_trends_${months}`;
        const cached = costCache.get(cacheKey);
        if (cached) {
            logger.debug(`Cost trends (${months} months) retrieved from cache`);
            return cached;
        }

        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const result = DEMO_MONTHLY_COSTS.slice(-months);
            costCache.set(cacheKey, result);
            return result;
        }

        const { data, error } = await supabase
            .from('monthly_costs')
            .select('*')
        .order('month', { ascending: true })
        .limit(months);

    if (error) throw error;
    return data || [];
}
