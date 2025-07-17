export default function SimpleTrialBalance() {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      width: '100%',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#000000'
      }}>
        Trial Balance
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <span style={{color: '#666666'}}>Total Debits</span>
        <span style={{color: '#000000', fontWeight: 'bold'}}>475689</span>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <span style={{color: '#666666'}}>Total Credits</span>
        <span style={{color: '#000000', fontWeight: 'bold'}}>475689</span>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '8px'
      }}>
        <span style={{color: '#000000', fontWeight: 'bold'}}>Balance</span>
        <span style={{color: '#059669', fontWeight: 'bold'}}>0</span>
      </div>
    </div>
  );
}