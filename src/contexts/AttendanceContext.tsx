import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: {
    time: string;
    location?: { lat: number; lng: number };
    photo?: string;
    address?: string;
  };
  checkOut?: {
    time: string;
    location?: { lat: number; lng: number };
    photo?: string;
    address?: string;
  };
  workingHours?: number;
  status: 'present' | 'late' | 'absent' | 'half-day';
}

interface AttendanceContextType {
  records: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  checkIn: (location?: { lat: number; lng: number }, photo?: string) => Promise<boolean>;
  checkOut: (location?: { lat: number; lng: number }, photo?: string) => Promise<boolean>;
  getRecordsByDateRange: (startDate: string, endDate: string) => AttendanceRecord[];
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      const parsedRecords = JSON.parse(savedRecords);
      setRecords(parsedRecords);
      
      const today = new Date().toISOString().split('T')[0];
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const todayRec = parsedRecords.find((r: AttendanceRecord) => 
        r.date === today && r.userId === currentUser.id
      );
      setTodayRecord(todayRec || null);
    }
  }, []);

  const saveRecords = (newRecords: AttendanceRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    // Mock address - in real app would use reverse geocoding API
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const checkIn = async (location?: { lat: number; lng: number }, photo?: string): Promise<boolean> => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return false;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });

    let address = '';
    if (location) {
      address = await getAddressFromCoords(location.lat, location.lng);
    }

    const existingRecordIndex = records.findIndex(r => r.date === today && r.userId === currentUser.id);
    
    if (existingRecordIndex >= 0) {
      // Update existing record
      const updatedRecords = [...records];
      updatedRecords[existingRecordIndex] = {
        ...updatedRecords[existingRecordIndex],
        checkIn: {
          time: timeString,
          location,
          photo,
          address
        },
        status: now.getHours() > 8 ? 'late' : 'present'
      };
      saveRecords(updatedRecords);
      setTodayRecord(updatedRecords[existingRecordIndex]);
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        userId: currentUser.id,
        date: today,
        checkIn: {
          time: timeString,
          location,
          photo,
          address
        },
        status: now.getHours() > 8 ? 'late' : 'present'
      };
      const updatedRecords = [...records, newRecord];
      saveRecords(updatedRecords);
      setTodayRecord(newRecord);
    }

    return true;
  };

  const checkOut = async (location?: { lat: number; lng: number }, photo?: string): Promise<boolean> => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return false;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });

    let address = '';
    if (location) {
      address = await getAddressFromCoords(location.lat, location.lng);
    }

    const existingRecordIndex = records.findIndex(r => r.date === today && r.userId === currentUser.id);
    
    if (existingRecordIndex >= 0) {
      const record = records[existingRecordIndex];
      let workingHours = 0;
      
      if (record.checkIn) {
        const checkInTime = new Date(`${today} ${record.checkIn.time}`);
        const checkOutTime = new Date(`${today} ${timeString}`);
        workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      }

      const updatedRecords = [...records];
      updatedRecords[existingRecordIndex] = {
        ...record,
        checkOut: {
          time: timeString,
          location,
          photo,
          address
        },
        workingHours: Math.round(workingHours * 100) / 100
      };
      saveRecords(updatedRecords);
      setTodayRecord(updatedRecords[existingRecordIndex]);
      return true;
    }

    return false;
  };

  const getRecordsByDateRange = (startDate: string, endDate: string): AttendanceRecord[] => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return records.filter(record => 
      record.userId === currentUser.id &&
      record.date >= startDate && 
      record.date <= endDate
    );
  };

  return (
    <AttendanceContext.Provider value={{
      records,
      todayRecord,
      checkIn,
      checkOut,
      getRecordsByDateRange,
      getCurrentLocation
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};