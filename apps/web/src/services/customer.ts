import axios from 'axios';

export const searchCustomers = async (search: string, slpCode: string) => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/search`,
    {
      search,
      slpCode,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data;
};

export const getCustomerAddress = async (cardCode: string) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/address/${cardCode}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data;
};

export const getCustomerfinancialInformation = async (cardCode: string) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/financial-information/${cardCode}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data;
};

export const getVehicleHistory = async (cardCode: string) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/vehicle-history/${cardCode}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  );
  return response.data;
};
