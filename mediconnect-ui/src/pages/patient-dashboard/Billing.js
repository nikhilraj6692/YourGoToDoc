import React from 'react';
import './Billing.css';

const Billing = () => {
  // Dummy data for bills
  const bills = [
    {
      id: 1,
      date: '2024-03-15',
      doctorName: 'Dr. Sarah Johnson',
      amount: 150.00,
      status: 'Paid',
      description: 'General Consultation'
    },
    {
      id: 2,
      date: '2024-03-20',
      doctorName: 'Dr. Michael Chen',
      amount: 200.00,
      status: 'Pending',
      description: 'Follow-up Consultation'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="billing-page">
      <h1>Billing & Payments</h1>
      
      <div className="billing-summary">
        <div className="summary-card">
          <h3>Total Balance</h3>
          <p className="amount">$200.00</p>
        </div>
        <div className="summary-card">
          <h3>Pending Payments</h3>
          <p className="amount">$200.00</p>
        </div>
        <div className="summary-card">
          <h3>Paid Amount</h3>
          <p className="amount">$150.00</p>
        </div>
      </div>

      <div className="bills-container">
        <h2>Recent Bills</h2>
        {bills.map((bill) => (
          <div key={bill.id} className="bill-card">
            <div className="bill-header">
              <h3>Dr. {bill.doctorName}</h3>
              <span className={`status ${bill.status.toLowerCase()}`}>
                {bill.status}
              </span>
            </div>
            <div className="bill-details">
              <p>
                <strong>Date:</strong> {formatDate(bill.date)}
              </p>
              <p>
                <strong>Description:</strong> {bill.description}
              </p>
              <p>
                <strong>Amount:</strong> ${bill.amount.toFixed(2)}
              </p>
            </div>
            {bill.status === 'Pending' && (
              <div className="bill-actions">
                <button className="btn-pay">Pay Now</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing; 