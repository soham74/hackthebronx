export interface CommunityReport {
  id: string;
  lat: number;
  lng: number;
  type: 'dark' | 'unsafe' | 'loitering' | 'harassment' | 'other';
  comment: string;
  timestamp: Date;
  verified: boolean;
  votes: number;
  userAgent?: string;
}

class ReportService {
  private storageKey = 'safepath_community_reports';
  private maxReports = 1000; // Prevent storage from growing too large
  private maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Get all reports from localStorage
  getReports(): CommunityReport[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const reports: CommunityReport[] = JSON.parse(stored);
      
      // Convert timestamp strings back to Date objects and filter out old reports
      const now = new Date().getTime();
      const validReports = reports
        .map(report => ({
          ...report,
          timestamp: new Date(report.timestamp)
        }))
        .filter(report => {
          const reportAge = now - report.timestamp.getTime();
          return reportAge <= this.maxAge;
        });

      // If we filtered out old reports, save the updated list
      if (validReports.length !== reports.length) {
        this.saveReports(validReports);
      }

      return validReports;
    } catch (error) {
      console.error('Error loading reports from storage:', error);
      return [];
    }
  }

  // Save reports to localStorage
  private saveReports(reports: CommunityReport[]): void {
    try {
      // Keep only the most recent reports if we exceed the limit
      const reportsToSave = reports
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.maxReports);
      
      localStorage.setItem(this.storageKey, JSON.stringify(reportsToSave));
    } catch (error) {
      console.error('Error saving reports to storage:', error);
      // If storage is full, try to clean up old reports and retry
      this.cleanupOldReports();
      try {
        const recentReports = reports.slice(0, Math.floor(this.maxReports / 2));
        localStorage.setItem(this.storageKey, JSON.stringify(recentReports));
      } catch (retryError) {
        console.error('Failed to save reports even after cleanup:', retryError);
      }
    }
  }

  // Add a new report
  addReport(report: Omit<CommunityReport, 'id' | 'timestamp' | 'verified' | 'votes'>): CommunityReport {
    const newReport: CommunityReport = {
      ...report,
      id: this.generateId(),
      timestamp: new Date(),
      verified: false,
      votes: 1, // Start with 1 vote (the reporter)
      userAgent: navigator.userAgent
    };

    const existingReports = this.getReports();
    
    // Check for duplicate reports (same location and type within 100m and 1 hour)
    const isDuplicate = existingReports.some(existing => {
      const distance = this.calculateDistance(
        report.lat, report.lng,
        existing.lat, existing.lng
      );
      const timeDiff = Math.abs(newReport.timestamp.getTime() - existing.timestamp.getTime());
      return distance < 100 && timeDiff < 60 * 60 * 1000 && existing.type === report.type;
    });

    if (isDuplicate) {
      throw new Error('A similar report already exists in this area');
    }

    const updatedReports = [newReport, ...existingReports];
    this.saveReports(updatedReports);
    
    console.log(`✅ Report added: ${report.type} at (${report.lat.toFixed(4)}, ${report.lng.toFixed(4)})`);
    return newReport;
  }

  // Update report votes
  updateReportVotes(reportId: string, increment: boolean): void {
    const reports = this.getReports();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      reports[reportIndex].votes += increment ? 1 : -1;
      // Don't let votes go below 0
      reports[reportIndex].votes = Math.max(0, reports[reportIndex].votes);
      this.saveReports(reports);
    }
  }

  // Mark report as verified
  verifyReport(reportId: string): void {
    const reports = this.getReports();
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
      reports[reportIndex].verified = true;
      this.saveReports(reports);
    }
  }

  // Delete a report
  deleteReport(reportId: string): void {
    const reports = this.getReports();
    const filteredReports = reports.filter(r => r.id !== reportId);
    this.saveReports(filteredReports);
  }

  // Get reports by area
  getReportsByArea(centerLat: number, centerLng: number, radiusMeters: number): CommunityReport[] {
    const allReports = this.getReports();
    return allReports.filter(report => {
      const distance = this.calculateDistance(centerLat, centerLng, report.lat, report.lng);
      return distance <= radiusMeters;
    });
  }

  // Get reports by type
  getReportsByType(type: CommunityReport['type']): CommunityReport[] {
    return this.getReports().filter(report => report.type === type);
  }

  // Clean up old reports
  private cleanupOldReports(): void {
    const reports = this.getReports();
    const now = new Date().getTime();
    
    const recentReports = reports.filter(report => {
      const reportAge = now - report.timestamp.getTime();
      return reportAge <= this.maxAge / 2; // Keep only reports from last 15 days
    });
    
    this.saveReports(recentReports);
  }

  // Generate unique ID
  private generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Export reports for analysis (can be extended for API integration)
  exportReports(): string {
    const reports = this.getReports();
    return JSON.stringify(reports, null, 2);
  }

  // Get statistics about reports
  getStatistics(): {
    total: number;
    byType: Record<CommunityReport['type'], number>;
    verified: number;
    recent: number; // Last 24 hours
  } {
    const reports = this.getReports();
    const now = new Date().getTime();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const stats = {
      total: reports.length,
      byType: {
        dark: 0,
        unsafe: 0,
        loitering: 0,
        harassment: 0,
        other: 0
      } as Record<CommunityReport['type'], number>,
      verified: 0,
      recent: 0
    };

    reports.forEach(report => {
      stats.byType[report.type]++;
      if (report.verified) stats.verified++;
      if (report.timestamp.getTime() > oneDayAgo) stats.recent++;
    });

    return stats;
  }
}

// Export singleton instance
export const reportService = new ReportService(); 