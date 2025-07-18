import React, { useState, useMemo } from 'react';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Camera, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { AttendanceRecord } from '@/contexts/AttendanceContext';

const History: React.FC = () => {
  const { getRecordsByDateRange } = useAttendance();
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState('all-months');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get last 30 days by default
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const allRecords = getRecordsByDateRange(startDate, endDate);

  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords];

    if (filterMonth && filterMonth !== 'all-months') {
      filtered = filtered.filter(record => record.date.startsWith(filterMonth));
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, filterMonth, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-success-foreground">Có mặt</Badge>;
      case 'late':
        return <Badge className="bg-warning text-warning-foreground">Muộn</Badge>;
      case 'absent':
        return <Badge variant="destructive">Vắng mặt</Badge>;
      default:
        return <Badge variant="secondary">Chưa xác định</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthString = date.toISOString().slice(0, 7);
      const monthLabel = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      months.push({ value: monthString, label: monthLabel });
    }
    return months;
  };

  const calculateStats = () => {
    const stats = {
      totalDays: filteredRecords.length,
      presentDays: filteredRecords.filter(r => r.status === 'present').length,
      lateDays: filteredRecords.filter(r => r.status === 'late').length,
      absentDays: filteredRecords.filter(r => r.status === 'absent').length,
      avgWorkingHours: 0
    };

    const workingHours = filteredRecords
      .filter(r => r.workingHours)
      .map(r => r.workingHours!);
    
    if (workingHours.length > 0) {
      stats.avgWorkingHours = workingHours.reduce((sum, hours) => sum + hours, 0) / workingHours.length;
    }

    return stats;
  };

  const stats = calculateStats();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Lịch sử chấm công</h1>
          <p className="text-muted-foreground">Xem lại quá trình làm việc của bạn</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.totalDays}</div>
              <div className="text-sm text-muted-foreground">Tổng ngày</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">{stats.presentDays}</div>
              <div className="text-sm text-muted-foreground">Có mặt</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">{stats.lateDays}</div>
              <div className="text-sm text-muted-foreground">Muộn</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">
                {stats.avgWorkingHours.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">TB giờ làm</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tháng</label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-months">Tất cả tháng</SelectItem>
                    {getMonthOptions().map(month => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="present">Có mặt</SelectItem>
                    <SelectItem value="late">Muộn</SelectItem>
                    <SelectItem value="absent">Vắng mặt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Không có dữ liệu chấm công
                </p>
                <p className="text-sm text-muted-foreground">
                  Hãy thử thay đổi bộ lọc hoặc chấm công để tạo dữ liệu mới
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className="shadow-soft">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRecord(
                      expandedRecord === record.id ? null : record.id
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">
                          {formatDate(record.date)}
                        </h3>
                        {getStatusBadge(record.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {record.checkIn && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Vào: {record.checkIn.time}</span>
                          </div>
                        )}
                        {record.checkOut && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Ra: {record.checkOut.time}</span>
                          </div>
                        )}
                        {record.workingHours && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{record.workingHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      {expandedRecord === record.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {expandedRecord === record.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Check In Details */}
                      {record.checkIn && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-success">Chi tiết vào làm</h4>
                          <div className="bg-success-light p-3 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-success" />
                              <span className="text-sm">Thời gian: {record.checkIn.time}</span>
                            </div>
                            {record.checkIn.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-success" />
                                <span className="text-sm">Vị trí: {record.checkIn.address}</span>
                              </div>
                            )}
                            {record.checkIn.photo && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-success" />
                                  <span className="text-sm">Ảnh chấm công:</span>
                                </div>
                                <img 
                                  src={record.checkIn.photo} 
                                  alt="Ảnh chấm công vào" 
                                  className="w-full max-w-xs h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Check Out Details */}
                      {record.checkOut && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-accent">Chi tiết tan làm</h4>
                          <div className="bg-accent-light p-3 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-sm">Thời gian: {record.checkOut.time}</span>
                            </div>
                            {record.checkOut.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-accent" />
                                <span className="text-sm">Vị trí: {record.checkOut.address}</span>
                              </div>
                            )}
                            {record.checkOut.photo && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-4 h-4 text-accent" />
                                  <span className="text-sm">Ảnh chấm công:</span>
                                </div>
                                <img 
                                  src={record.checkOut.photo} 
                                  alt="Ảnh chấm công ra" 
                                  className="w-full max-w-xs h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;