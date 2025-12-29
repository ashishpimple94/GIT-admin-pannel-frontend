import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../config/axios';
import AuthContext from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    resolution: ''
  });
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [downloadingReport, setDownloadingReport] = useState(false);

  const fetchGrievances = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.priority) params.append('priority', filters.priority);

      const res = await api.get(`/api/admin/grievances?${params.toString()}`);
      console.log('📧 Grievances fetched:', res.data.length);
      // Debug: Check if email is in the data
      if (res.data.length > 0) {
        console.log('📧 First grievance userId data:', JSON.stringify(res.data[0].userId, null, 2));
        console.log('📧 First grievance email:', res.data[0].userId?.email);
        console.log('📧 All grievances with email check:');
        res.data.slice(0, 5).forEach((g, idx) => {
          console.log(`   ${idx + 1}. User: ${g.userId?.fullName || g.userId?.username}, Email: ${g.userId?.email || 'NO EMAIL'}`);
        });
      }
      setGrievances(res.data);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGrievances();
    fetchStats();
  }, [fetchGrievances]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateGrievance = async () => {
    try {
      await api.put(`/api/admin/grievances/${selectedGrievance._id}`, updateData);
      fetchGrievances();
      fetchStats();
      setSelectedGrievance(null);
      setUpdateData({ status: '', resolution: '' });
      alert('Grievance updated successfully!');
    } catch (error) {
      alert('Failed to update grievance');
      console.error('Error updating grievance:', error);
    }
  };

  const handleDeleteGrievance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grievance? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting grievance:', id);
      const response = await api.delete(`/api/admin/grievances/${id}`);
      console.log('✅ Delete response:', response.data);
      
      // Refresh the list and stats
      await fetchGrievances();
      await fetchStats();
      
      alert('Grievance deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting grievance:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete grievance';
      alert(`Failed to delete grievance: ${errorMessage}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const [year, month] = reportMonth.split('-');
      const apiBaseURL = process.env.REACT_APP_API_URL || 'https://git-backend-new-4gds.onrender.com';
      const response = await fetch(`${apiBaseURL}/api/admin/reports/monthly?month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grievance-report-${month}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const filteredGrievances = grievances.filter(grievance => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      grievance.subject?.toLowerCase().includes(query) ||
      grievance.description?.toLowerCase().includes(query) ||
      grievance.userId?.fullName?.toLowerCase().includes(query) ||
      grievance.userId?.username?.toLowerCase().includes(query) ||
      grievance.userId?.email?.toLowerCase().includes(query) ||
      grievance.category?.toLowerCase().includes(query)
    );
  });

  if (loading && !stats) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-content">
            <h1 className="admin-panel-title">
              <i className="fas fa-shield-alt"></i> Admin Dashboard
            </h1>
            {user && (
              <p className="admin-welcome">
                Welcome back, <strong>{user.fullName || user.username}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Report Download Section */}
        <div className="report-section">
          <div className="report-card">
            <h3><i className="fas fa-file-pdf"></i> Download Monthly Report</h3>
            <div className="report-controls">
              <input
                type="month"
                className="form-control report-input"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              />
              <button
                className="btn btn-download"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
              >
                {downloadingReport ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Downloading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className="admin-stats">
            <div className="stat-card stat-total">
              <div className="stat-icon">
                <i className="fas fa-list-alt"></i>
              </div>
              <div className="stat-content">
                <h3>Total Grievances</h3>
                <p className="stat-number">{stats.totalGrievances}</p>
              </div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-number">{stats.pending}</p>
              </div>
            </div>
            <div className="stat-card stat-progress">
              <div className="stat-icon">
                <i className="fas fa-spinner"></i>
              </div>
              <div className="stat-content">
                <h3>In Progress</h3>
                <p className="stat-number">{stats.inProgress}</p>
              </div>
            </div>
            <div className="stat-card stat-resolved">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3>Resolved</h3>
                <p className="stat-number">{stats.resolved}</p>
              </div>
            </div>
            <div className="stat-card stat-rejected">
              <div className="stat-icon">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="stat-content">
                <h3>Rejected</h3>
                <p className="stat-number">{stats.rejected}</p>
              </div>
            </div>
          </div>
        )}

        <div className="filters-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search by subject, user, email, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <div className="admin-filters">
            <div className="filter-group">
              <CustomSelect
                label="Status"
                icon="fas fa-filter"
                placeholder="All Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
                className="filter-select-wrapper"
              />
            </div>
            <div className="filter-group">
              <CustomSelect
                label="Category"
                icon="fas fa-tag"
                placeholder="All Categories"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'academic', label: 'Academic' },
                  { value: 'administrative', label: 'Administrative' },
                  { value: 'infrastructure', label: 'Infrastructure' },
                  { value: 'hostel', label: 'Hostel' },
                  { value: 'library', label: 'Library' },
                  { value: 'examination', label: 'Examination' },
                  { value: 'other', label: 'Other' }
                ]}
                className="filter-select-wrapper"
              />
            </div>
            <div className="filter-group">
              <CustomSelect
                label="Priority"
                icon="fas fa-flag"
                placeholder="All Priorities"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                className="filter-select-wrapper"
              />
            </div>
            {(filters.status || filters.category || filters.priority) && (
              <button
                className="btn btn-clear-filters"
                onClick={() => setFilters({ status: '', category: '', priority: '' })}
              >
                <i className="fas fa-times"></i> Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="grievances-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-list"></i> All Grievances
              {filteredGrievances.length > 0 && (
                <span className="count-badge">{filteredGrievances.length}</span>
              )}
            </h2>
          </div>
          <div className="grievances-table">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading grievances...</p>
              </div>
            ) : filteredGrievances.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No grievances found</p>
                {searchQuery && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th><i className="fas fa-file-alt"></i> Subject</th>
                      <th><i className="fas fa-user"></i> User</th>
                      <th><i className="fas fa-tag"></i> Category</th>
                      <th><i className="fas fa-flag"></i> Priority</th>
                      <th><i className="fas fa-info-circle"></i> Status</th>
                      <th><i className="fas fa-calendar"></i> Date</th>
                      <th><i className="fas fa-cog"></i> Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrievances.map(grievance => (
                      <tr key={grievance._id}>
                        <td className="grievance-subject">
                          <strong>{grievance.subject}</strong>
                          {grievance.description && (
                            <p className="grievance-preview">
                              {grievance.description.substring(0, 50)}...
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="user-info">
                            <i className="fas fa-user-circle"></i>
                            <div className="user-details">
                              <strong className="user-name">{grievance.userId?.fullName || grievance.userId?.username || 'Unknown User'}</strong>
                              {grievance.userId?.email ? (
                                <div className="user-email">
                                  <i className="fas fa-envelope"></i> 
                                  <span className="email-text">{grievance.userId.email}</span>
                                </div>
                              ) : (
                                <div className="user-email user-email-missing">
                                  <i className="fas fa-exclamation-circle"></i> 
                                  <span>Email not available</span>
                                </div>
                              )}
                              <span className="user-type">{grievance.userId?.userType || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">{grievance.category}</span>
                        </td>
                        <td>
                          <span className={`priority-badge priority-${grievance.priority}`}>
                            <i className={`fas fa-${grievance.priority === 'urgent' ? 'exclamation-triangle' : grievance.priority === 'high' ? 'arrow-up' : grievance.priority === 'medium' ? 'minus' : 'arrow-down'}`}></i>
                            {grievance.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${grievance.status}`}>
                            {grievance.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="date-info">
                            <i className="fas fa-calendar-alt"></i>
                            {new Date(grievance.createdAt).toLocaleDateString()}
                            <span className="time-info">
                              {new Date(grievance.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => {
                                setSelectedGrievance(grievance);
                                setUpdateData({
                                  status: grievance.status,
                                  resolution: grievance.resolution || ''
                                });
                              }}
                              title="Update Grievance"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteGrievance(grievance._id)}
                              title="Delete Grievance"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selectedGrievance && (
          <div className="modal-overlay" onClick={() => setSelectedGrievance(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <i className="fas fa-edit"></i> Update Grievance
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedGrievance(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="grievance-details-preview">
                  <h3><i className="fas fa-file-alt"></i> {selectedGrievance.subject}</h3>
                  <div className="detail-row">
                    <span><i className="fas fa-user"></i> User:</span>
                    <strong>{selectedGrievance.userId?.fullName || selectedGrievance.userId?.username}</strong>
                  </div>
                  <div className="detail-row">
                    <span><i className="fas fa-tag"></i> Category:</span>
                    <strong>{selectedGrievance.category}</strong>
                  </div>
                  <div className="detail-row">
                    <span><i className="fas fa-flag"></i> Priority:</span>
                    <span className={`priority-badge priority-${selectedGrievance.priority}`}>
                      {selectedGrievance.priority}
                    </span>
                  </div>
                  {selectedGrievance.description && (
                    <div className="detail-row full-width">
                      <span><i className="fas fa-align-left"></i> Description:</span>
                      <p>{selectedGrievance.description}</p>
                    </div>
                  )}
                  {selectedGrievance.attachments && selectedGrievance.attachments.length > 0 && (
                    <div className="detail-row full-width">
                      <span><i className="fas fa-paperclip"></i> Attachments ({selectedGrievance.attachments.length}):</span>
                      <div style={{ marginTop: '10px' }}>
                        {selectedGrievance.attachments.map((attachment, index) => {
                          const apiBaseURL = process.env.REACT_APP_API_URL || 'https://git-backend-new-4gds.onrender.com';
                          const fileUrl = `${apiBaseURL}/uploads/${attachment.filePath}`;
                          return (
                            <a
                              key={index}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                margin: '5px 5px 5px 0',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: '#1f2937',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e5e7eb';
                                e.currentTarget.style.borderColor = '#667eea';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                            >
                              <i className="fas fa-file" style={{ color: '#667eea' }}></i>
                              <span>{attachment.fileName}</span>
                              <i className="fas fa-external-link-alt" style={{ fontSize: '12px', color: '#6b7280' }}></i>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <CustomSelect
                  label="Status"
                  icon="fas fa-info-circle"
                  placeholder="Select Status"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'rejected', label: 'Rejected' }
                  ]}
                />
                <div className="form-group">
                  <label>
                    <i className="fas fa-comment-dots"></i> Resolution / Comments
                  </label>
                  <textarea
                    className="form-control"
                    value={updateData.resolution}
                    onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                    rows="6"
                    placeholder="Enter resolution details or comments..."
                  ></textarea>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleUpdateGrievance}>
                  <i className="fas fa-save"></i> Update Grievance
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedGrievance(null)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

