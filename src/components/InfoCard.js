import React from 'react';

const InfoCard = ({ title, value }) => (
  <div className="info-card">
    <h3>{title}</h3>
    <div>{value || '-'}</div>
  </div>
);

export default InfoCard;
