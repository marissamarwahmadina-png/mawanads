// Mock data and functions for frontend-only testing

export const mockContactSubmit = async (data) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Store in localStorage for demo purposes
  const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
  const newContact = {
    ...data,
    id: Date.now(),
    submittedAt: new Date().toISOString()
  };
  contacts.push(newContact);
  localStorage.setItem('contacts', JSON.stringify(contacts));
  
  console.log('Contact form submitted (MOCK):', newContact);
  
  return {
    success: true,
    data: newContact
  };
};

export const getMockContacts = () => {
  return JSON.parse(localStorage.getItem('contacts') || '[]');
};