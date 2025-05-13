import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import UnifiedScheduleModal from './UnifiedScheduleModal';

/**
 * DEPRECATED: This component has been replaced by UnifiedScheduleModal
 * This file is kept for backward compatibility but forwards props to UnifiedScheduleModal
 * 
 * @deprecated Use UnifiedScheduleModal instead with mode='confirm'
 */
const ConfirmScheduleModal = ({ open, onClose, items, recipes, onConfirm, initialDate }) => {
  const { department } = useParams();
  const { showWarning } = useNotifications();
  
  // Show deprecation warning
  useEffect(() => {
    console.warn('ConfirmScheduleModal is deprecated. Use UnifiedScheduleModal with mode="confirm" instead.');
    
    if (open) {
      showWarning('This component is deprecated. Please use UnifiedScheduleModal instead.');
    }
  }, [open, showWarning]);
  
  // Handle the onConfirm callback
  const handleSave = (data) => {
    // Map the data format from UnifiedScheduleModal to the format expected by onConfirm
    onConfirm({
      items: data.items || [],
      scheduledDate: data.scheduledDate || initialDate,
      managerName: data.managerName || '',
      handlersNames: data.handlersNames || '',
      ingredientSuppliers: data.ingredientSuppliers || []
    });
  };
  
  return (
    <UnifiedScheduleModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      department={department}
      recipes={recipes}
      initialItems={items}
      initialDate={initialDate}
      mode="confirm"
      deprecationNotice={
        <div style={{ padding: '8px 16px', backgroundColor: '#fff3cd', color: '#856404', marginBottom: '16px', borderRadius: '4px' }}>
          This component has been replaced by UnifiedScheduleModal for better functionality.
          Future updates will only be made to the new component.
        </div>
      }
    />
  );
};

export default ConfirmScheduleModal;
