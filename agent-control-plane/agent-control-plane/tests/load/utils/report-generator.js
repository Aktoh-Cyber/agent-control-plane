/**
 * Load Test Report Generator
 * Generates comprehensive HTML reports from K6 JSON output
 */

import fs from 'fs';
import path from 'path';

class LoadTestReportGenerator {
  constructor(resultsPath, outputPath) {
    this.resultsPath = resultsPath;
    this.outputPath = outputPath;
    this.data = null;
  }

  loadResults() {
    try {
      const rawData = fs.readFileSync(this.resultsPath, 'utf8');
      this.data = JSON.parse(rawData);
      return true;
    } catch (error) {
      console.error('Error loading results:', error.message);
      return false;
    }
  }

  parseMetrics() {
    if (!this.data || !this.data.metrics) {
      return null;
    }

    const metrics = {};

    Object.entries(this.data.metrics).forEach(([name, data]) => {
      if (data.type === 'trend') {
        metrics[name] = {
          type: 'trend',
          min: data.values.min,
          max: data.values.max,
          avg: data.values.avg,
          med: data.values.med,
          p90: data.values['p(90)'],
          p95: data.values['p(95)'],
          p99: data.values['p(99)'],
        };
      } else if (data.type === 'rate') {
        metrics[name] = {
          type: 'rate',
          rate: data.values.rate,
          passes: data.values.passes,
          fails: data.values.fails,
        };
      } else if (data.type === 'counter') {
        metrics[name] = {
          type: 'counter',
          count: data.values.count,
          rate: data.values.rate,
        };
      } else if (data.type === 'gauge') {
        metrics[name] = {
          type: 'gauge',
          value: data.values.value,
        };
      }
    });

    return metrics;
  }

  generateHTML() {
    const metrics = this.parseMetrics();

    if (!metrics) {
      console.error('No metrics to generate report from');
      return null;
    }

    const testName = path.basename(this.resultsPath, '.json');
    const timestamp = new Date().toISOString();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Report - ${testName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .meta {
            opacity: 0.9;
            font-size: 14px;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section h2 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .metric-card {
            background: #f9f9f9;
            border-radius: 6px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }

        .metric-card.success {
            border-left-color: #10b981;
        }

        .metric-card.warning {
            border-left-color: #f59e0b;
        }

        .metric-card.error {
            border-left-color: #ef4444;
        }

        .metric-name {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 500;
        }

        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .metric-details {
            font-size: 12px;
            color: #888;
        }

        .metric-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-top: 10px;
        }

        .metric-detail {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
        }

        .metric-detail-label {
            color: #666;
        }

        .metric-detail-value {
            font-weight: 600;
            color: #333;
        }

        .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 6px;
        }

        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
        }

        th {
            background: #f5f5f5;
            font-weight: 600;
            color: #333;
        }

        tr:hover {
            background: #f9f9f9;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge.success {
            background: #d1fae5;
            color: #065f46;
        }

        .badge.warning {
            background: #fef3c7;
            color: #92400e;
        }

        .badge.error {
            background: #fee2e2;
            color: #991b1b;
        }

        footer {
            background: #f5f5f5;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .summary-stats {
                grid-template-columns: repeat(2, 1fr);
            }

            .metric-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Load Test Report</h1>
            <div class="meta">
                <div>Test: ${testName}</div>
                <div>Generated: ${timestamp}</div>
            </div>
        </header>

        <div class="content">
            ${this.generateSummarySection(metrics)}
            ${this.generateResponseTimeSection(metrics)}
            ${this.generateThroughputSection(metrics)}
            ${this.generateErrorSection(metrics)}
            ${this.generateCustomMetricsSection(metrics)}
        </div>

        <footer>
            Generated by Agentic-Flow Load Testing Suite
        </footer>
    </div>
</body>
</html>
    `;

    return html;
  }

  generateSummarySection(metrics) {
    const httpReqDuration = metrics.http_req_duration || {};
    const httpReqFailed = metrics.http_req_failed || {};
    const httpReqs = metrics.http_reqs || {};

    const avgResponseTime = httpReqDuration.avg ? httpReqDuration.avg.toFixed(2) : 'N/A';
    const errorRate = httpReqFailed.rate ? (httpReqFailed.rate * 100).toFixed(2) : '0';
    const totalRequests = httpReqs.count || 0;
    const requestsPerSec = httpReqs.rate ? httpReqs.rate.toFixed(2) : 'N/A';

    return `
      <div class="section">
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-value">${avgResponseTime}ms</div>
            <div class="stat-label">Avg Response Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${errorRate}%</div>
            <div class="stat-label">Error Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totalRequests}</div>
            <div class="stat-label">Total Requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${requestsPerSec}</div>
            <div class="stat-label">Requests/sec</div>
          </div>
        </div>
      </div>
    `;
  }

  generateResponseTimeSection(metrics) {
    const responseTimeMetrics = Object.entries(metrics).filter(
      ([name, data]) =>
        data.type === 'trend' && (name.includes('duration') || name.includes('time'))
    );

    if (responseTimeMetrics.length === 0) return '';

    const cards = responseTimeMetrics
      .map(([name, data]) => {
        const severity = data.p95 > 2000 ? 'error' : data.p95 > 1000 ? 'warning' : 'success';

        return `
          <div class="metric-card ${severity}">
            <div class="metric-name">${name}</div>
            <div class="metric-value">${data.avg.toFixed(2)}ms</div>
            <div class="metric-details-grid">
              <div class="metric-detail">
                <span class="metric-detail-label">Min</span>
                <span class="metric-detail-value">${data.min.toFixed(2)}ms</span>
              </div>
              <div class="metric-detail">
                <span class="metric-detail-label">Max</span>
                <span class="metric-detail-value">${data.max.toFixed(2)}ms</span>
              </div>
              <div class="metric-detail">
                <span class="metric-detail-label">Median</span>
                <span class="metric-detail-value">${data.med.toFixed(2)}ms</span>
              </div>
              <div class="metric-detail">
                <span class="metric-detail-label">P95</span>
                <span class="metric-detail-value">${data.p95.toFixed(2)}ms</span>
              </div>
              <div class="metric-detail">
                <span class="metric-detail-label">P99</span>
                <span class="metric-detail-value">${data.p99.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="section">
        <h2>Response Times</h2>
        <div class="metric-grid">${cards}</div>
      </div>
    `;
  }

  generateThroughputSection(metrics) {
    const throughputMetrics = Object.entries(metrics).filter(
      ([name, data]) =>
        data.type === 'counter' || (data.type === 'trend' && name.includes('throughput'))
    );

    if (throughputMetrics.length === 0) return '';

    const cards = throughputMetrics
      .map(([name, data]) => {
        if (data.type === 'counter') {
          return `
            <div class="metric-card">
              <div class="metric-name">${name}</div>
              <div class="metric-value">${data.count}</div>
              <div class="metric-details">${data.rate ? data.rate.toFixed(2) : 0} per second</div>
            </div>
          `;
        }
        return '';
      })
      .join('');

    return `
      <div class="section">
        <h2>Throughput</h2>
        <div class="metric-grid">${cards}</div>
      </div>
    `;
  }

  generateErrorSection(metrics) {
    const errorMetrics = Object.entries(metrics).filter(
      ([name, data]) => data.type === 'rate' || name.includes('error') || name.includes('failed')
    );

    if (errorMetrics.length === 0) return '';

    const cards = errorMetrics
      .map(([name, data]) => {
        const errorRate = data.rate * 100;
        const severity = errorRate > 5 ? 'error' : errorRate > 1 ? 'warning' : 'success';

        return `
          <div class="metric-card ${severity}">
            <div class="metric-name">${name}</div>
            <div class="metric-value">${errorRate.toFixed(2)}%</div>
            <div class="metric-details">
              Passes: ${data.passes || 0} | Fails: ${data.fails || 0}
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div class="section">
        <h2>Error Rates</h2>
        <div class="metric-grid">${cards}</div>
      </div>
    `;
  }

  generateCustomMetricsSection(metrics) {
    const customMetrics = Object.entries(metrics).filter(
      ([name]) =>
        !name.startsWith('http_') &&
        !name.includes('iteration') &&
        !name.includes('vus') &&
        !name.includes('data_')
    );

    if (customMetrics.length === 0) return '';

    const cards = customMetrics
      .map(([name, data]) => {
        if (data.type === 'gauge') {
          return `
            <div class="metric-card">
              <div class="metric-name">${name}</div>
              <div class="metric-value">${data.value}</div>
            </div>
          `;
        } else if (data.type === 'trend') {
          return `
            <div class="metric-card">
              <div class="metric-name">${name}</div>
              <div class="metric-value">${data.avg.toFixed(2)}</div>
              <div class="metric-details">P95: ${data.p95.toFixed(2)}</div>
            </div>
          `;
        }
        return '';
      })
      .join('');

    return `
      <div class="section">
        <h2>Custom Metrics</h2>
        <div class="metric-grid">${cards}</div>
      </div>
    `;
  }

  generate() {
    if (!this.loadResults()) {
      return false;
    }

    const html = this.generateHTML();

    if (!html) {
      return false;
    }

    try {
      fs.writeFileSync(this.outputPath, html, 'utf8');
      console.log(`Report generated: ${this.outputPath}`);
      return true;
    } catch (error) {
      console.error('Error writing report:', error.message);
      return false;
    }
  }
}

// CLI usage
if (process.argv.length >= 4) {
  const resultsPath = process.argv[2];
  const outputPath = process.argv[3];

  const generator = new LoadTestReportGenerator(resultsPath, outputPath);
  const success = generator.generate();

  process.exit(success ? 0 : 1);
}

export default LoadTestReportGenerator;
