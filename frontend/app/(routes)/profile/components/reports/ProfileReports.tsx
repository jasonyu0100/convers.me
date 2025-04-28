import { useState } from 'react';
import { ProfileReport } from '../../../../types/profile';
import { useProfile } from '../../hooks/useProfile';

/**
 * Report card component for individual reports
 */
function ReportCard({ report }: { report: ProfileReport }) {
  const [expanded, setExpanded] = useState(false);
  const { selectedYear, selectedQuarter } = useProfile();

  // Check if this report is for the currently selected time period
  const isCurrentPeriod = report.year === selectedYear && report.quarter === selectedQuarter;
  const isQuarterlyReport = report.periodType === 'quarter';
  const metrics = report.metrics;

  // Colors for metric indicators
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 70) return 'text-blue-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`rounded-lg border ${
        isCurrentPeriod ? 'border-slate-200 bg-blue-50/40' : 'border-gray-200 bg-white/80'
      } overflow-hidden transition-all duration-200 ${expanded ? 'shadow-md' : ''}`}
    >
      {/* Card Header */}
      <div className='bg-white/80 p-4'>
        <div className='flex items-center gap-4'>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isQuarterlyReport ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <svg className={`h-6 w-6 ${isQuarterlyReport ? 'text-blue-600' : 'text-gray-600'}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d={
                  isQuarterlyReport
                    ? 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    : 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                }
              />
            </svg>
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              {isQuarterlyReport && <span className='rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700'>Quarterly</span>}
              <h3 className='truncate font-medium text-gray-800'>{report.title}</h3>
            </div>
            <p className='text-sm text-gray-600'>{report.period}</p>
          </div>

          <button onClick={() => setExpanded(!expanded)} className='p-1 text-gray-500 transition-colors hover:text-gray-700'>
            <svg className={`h-5 w-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
            </svg>
          </button>

          <a
            href={report.downloadUrl}
            className='flex h-9 shrink-0 items-center rounded-lg bg-blue-100 px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200'
            download={`performance-report-${report.period.toLowerCase().replace(' ', '-')}.pdf`}
          >
            <svg className='mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
            </svg>
            Download
          </a>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && metrics && (
        <div className='border-t border-gray-100 bg-gray-50/50 p-4'>
          <div className='grid grid-cols-4 gap-4'>
            <div className='rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-gray-500'>Events</span>
                <svg className='h-4 w-4 text-blue-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <p className='mt-1 text-lg font-semibold text-gray-800'>{metrics.eventCount}</p>
            </div>

            <div className='rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-gray-500'>Processes</span>
                <svg className='h-4 w-4 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
              </div>
              <p className='mt-1 text-lg font-semibold text-gray-800'>{metrics.processesDone}</p>
            </div>

            <div className='rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-gray-500'>Hours</span>
                <svg className='h-4 w-4 text-purple-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <p className='mt-1 text-lg font-semibold text-gray-800'>{metrics.hoursSpent}</p>
            </div>

            <div className='rounded-lg border border-gray-100 bg-white/80 p-3 shadow-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-gray-500'>Efficiency</span>
                <svg className={`h-4 w-4 ${getEfficiencyColor(metrics.efficiency)}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
              </div>
              <p className={`mt-1 text-lg font-semibold ${getEfficiencyColor(metrics.efficiency)}`}>{metrics.efficiency}%</p>
            </div>
          </div>

          <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
            <span>Generated: {report.dateGenerated}</span>
            <span>Size: {report.fileSize}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quarterly Summary Card component
 */
function QuarterlySummaryCard({ report }: { report: ProfileReport }) {
  const metrics = report.metrics;

  if (!report || !metrics) return null;

  return (
    <div className='mb-6 rounded-xl border border-blue-100 bg-white/80 p-6'>
      <div className='flex items-start'>
        <div className='mr-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100'>
          <svg className='h-7 w-7 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
        </div>

        <div className='flex-1'>
          <h3 className='text-xl font-semibold text-gray-800'>{report.title}</h3>
          <p className='text-sm text-gray-600'>Summary of all activity from {report.period}</p>

          <div className='mt-4 grid grid-cols-4 gap-6'>
            <div>
              <div className='text-3xl font-bold text-gray-900'>{metrics.eventCount}</div>
              <div className='text-sm font-medium text-gray-600'>Events</div>
            </div>

            <div>
              <div className='text-3xl font-bold text-gray-900'>{metrics.processesDone}</div>
              <div className='text-sm font-medium text-gray-600'>Processes</div>
            </div>

            <div>
              <div className='text-3xl font-bold text-gray-900'>{metrics.hoursSpent}</div>
              <div className='text-sm font-medium text-gray-600'>Hours</div>
            </div>

            <div>
              <div className='text-3xl font-bold text-gray-900'>{metrics.efficiency}%</div>
              <div className='text-sm font-medium text-gray-600'>Efficiency</div>
            </div>
          </div>
        </div>

        <a
          href={report.downloadUrl}
          className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700'
          download={`performance-report-${report.period.toLowerCase().replace(' ', '-')}.pdf`}
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
          </svg>
          Download Full Report
        </a>
      </div>
    </div>
  );
}

/**
 * Component for displaying performance reports
 */
export function ProfileReports() {
  const { reports, selectedYear, selectedQuarter, selectedWeek } = useProfile();

  if (!reports || reports.length === 0) {
    return (
      <div className='flex h-64 flex-col items-center justify-center p-6 text-center'>
        <svg className='mb-4 h-16 w-16 text-gray-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='1.5'
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
        <h3 className='mb-2 text-lg font-medium text-gray-700'>No Reports Available</h3>
        <p className='text-gray-500'>No performance reports have been generated for this period.</p>
      </div>
    );
  }

  // Create period string for display
  const getPeriodText = () => {
    let periodText = `Q${selectedQuarter} ${selectedYear}`;
    if (selectedWeek) {
      periodText += ` - Week ${selectedWeek}`;
    }
    return periodText;
  };

  // Filter reports by selected time period
  const filteredReports = reports.filter((report) => {
    // Match year and quarter
    const matchesQuarter = report.year === selectedYear && report.quarter === selectedQuarter;

    // If week is selected, also check that
    if (selectedWeek && matchesQuarter) {
      // Weekly reports should match the selected week
      if (report.periodType === 'week') {
        return report.week === selectedWeek;
      }
      // Show quarterly reports regardless of selected week
      return report.periodType === 'quarter';
    }

    return matchesQuarter;
  });

  // Separate quarterly and weekly reports
  const quarterlyReport = filteredReports.find((report) => report.periodType === 'quarter');
  const weeklyReports = filteredReports.filter((report) => report.periodType === 'week').sort((a, b) => (b.week || 0) - (a.week || 0)); // Sort by week number, most recent first

  return (
    <div className='flex flex-col space-y-6'>
      {/* Time period indicator */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium text-slate-800'>Reports</h2>
        <span className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600'>{getPeriodText()}</span>
      </div>

      {/* Featured Quarterly Report */}
      {quarterlyReport && <QuarterlySummaryCard report={quarterlyReport} />}

      {/* Weekly Reports Section */}
      <div className='space-y-3'>
        {weeklyReports.length > 0 ? (
          weeklyReports.map((report) => <ReportCard key={report.id} report={report} />)
        ) : (
          <div className='rounded-lg border-1 border-dashed border-gray-300 bg-white/80 p-6 text-center'>
            <svg className='mx-auto mb-3 h-10 w-10 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='1.5'
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <h3 className='mb-1 text-base font-medium text-gray-700'>No Weekly Reports Available</h3>
            <p className='text-sm text-gray-500'>No weekly reports have been generated for this quarter yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
