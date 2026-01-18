// Google Analytics and Conversion Tracking Utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type ConversionEvent = 
  | 'instructor_search'
  | 'instructor_profile_view'
  | 'booking_initiated'
  | 'booking_completed'
  | 'instructor_registration_started'
  | 'instructor_registration_completed'
  | 'calculator_used'
  | 'cnh2025_cta_clicked'
  | 'pricing_viewed';

export interface ConversionEventData {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  instructor_id?: string;
  booking_id?: string;
  [key: string]: any;
}

/**
 * Track a conversion event
 */
export const trackConversion = (
  eventName: ConversionEvent,
  eventData?: ConversionEventData
) => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: eventData?.event_category || 'engagement',
      event_label: eventData?.event_label,
      value: eventData?.value,
      currency: eventData?.currency || 'BRL',
      ...eventData,
    });
  }

  // Console log in development
  if (import.meta.env.DEV) {
    console.log('📊 Conversion Event:', eventName, eventData);
  }
};

/**
 * Track page view
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }

  if (import.meta.env.DEV) {
    console.log('📄 Page View:', pagePath, pageTitle);
  }
};

/**
 * Track CTA click
 */
export const trackCTAClick = (
  ctaName: string,
  location: string,
  additionalData?: Record<string, any>
) => {
  trackConversion('cnh2025_cta_clicked', {
    event_category: 'cta',
    event_label: ctaName,
    cta_location: location,
    ...additionalData,
  });
};

/**
 * Track calculator usage
 */
export const trackCalculatorUsage = (
  pricePerHour: number,
  hoursPerMonth: number,
  netRevenue: number
) => {
  trackConversion('calculator_used', {
    event_category: 'calculator',
    price_per_hour: pricePerHour,
    hours_per_month: hoursPerMonth,
    net_revenue: netRevenue,
  });
};

/**
 * Track instructor search
 */
export const trackInstructorSearch = (filters?: Record<string, any>) => {
  trackConversion('instructor_search', {
    event_category: 'search',
    ...filters,
  });
};

/**
 * Track booking flow
 */
export const trackBookingStep = (
  step: 'initiated' | 'completed',
  instructorId?: string,
  bookingId?: string,
  value?: number
) => {
  const eventName = step === 'initiated' ? 'booking_initiated' : 'booking_completed';
  
  trackConversion(eventName, {
    event_category: 'booking',
    instructor_id: instructorId,
    booking_id: bookingId,
    value,
  });
};

/**
 * Initialize Google Analytics
 */
export const initializeAnalytics = (measurementId: string) => {
  if (typeof window === 'undefined') return;

  // Create script tag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer?.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll handle page views manually
  });

  if (import.meta.env.DEV) {
    console.log('📊 Analytics initialized:', measurementId);
  }
};
