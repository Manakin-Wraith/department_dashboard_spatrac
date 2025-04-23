import React from 'react';

const InfoCard = ({ title, value }) => (
  <div className="info-card">
    <h3>{title}</h3>
    <p>{value || '-'}</p>
  </div>
);

export default InfoCard;
