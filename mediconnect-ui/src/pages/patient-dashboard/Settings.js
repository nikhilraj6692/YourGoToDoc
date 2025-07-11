import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      appointmentReminders: true,
      billingAlerts: true
    },
    privacy: {
      shareMedicalHistory: false,
      shareContactInfo: true
    },
    preferences: {
      language: 'English',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY'
    }
  });

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleSelect = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-container">
        {/* Notifications Section */}
        <div className="settings-section">
          <h2>Notifications</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Notifications</h3>
                <p>Receive notifications via email</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={() => handleToggle('notifications', 'email')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>SMS Notifications</h3>
                <p>Receive notifications via SMS</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={() => handleToggle('notifications', 'sms')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Appointment Reminders</h3>
                <p>Get reminders for upcoming appointments</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.appointmentReminders}
                  onChange={() => handleToggle('notifications', 'appointmentReminders')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Billing Alerts</h3>
                <p>Receive alerts for pending payments</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.billingAlerts}
                  onChange={() => handleToggle('notifications', 'billingAlerts')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-section">
          <h2>Privacy</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Share Medical History</h3>
                <p>Allow doctors to view your medical history</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.privacy.shareMedicalHistory}
                  onChange={() => handleToggle('privacy', 'shareMedicalHistory')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Share Contact Information</h3>
                <p>Allow doctors to contact you directly</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.privacy.shareContactInfo}
                  onChange={() => handleToggle('privacy', 'shareContactInfo')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Language</h3>
                <p>Select your preferred language</p>
              </div>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSelect('preferences', 'language', e.target.value)}
                className="setting-select"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Timezone</h3>
                <p>Select your timezone</p>
              </div>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => handleSelect('preferences', 'timezone', e.target.value)}
                className="setting-select"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Date Format</h3>
                <p>Select your preferred date format</p>
              </div>
              <select
                value={settings.preferences.dateFormat}
                onChange={(e) => handleSelect('preferences', 'dateFormat', e.target.value)}
                className="setting-select"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 