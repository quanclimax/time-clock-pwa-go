import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, MapPin, Camera, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { todayRecord, checkIn, checkOut, getCurrentLocation } = useAttendance();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = today.toLocaleTimeString('vi-VN', { hour12: false });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setUseCamera(true);
    } catch (error) {
      toast({
        title: "Lỗi camera",
        description: "Không thể truy cập camera. Vui lòng cho phép quyền truy cập.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        stopCamera();
      }
    }
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      let location = null;
      if (useLocation) {
        location = await getCurrentLocation();
        if (!location) {
          toast({
            title: "Cảnh báo",
            description: "Không thể lấy vị trí hiện tại. Tiếp tục chấm công không có vị trí.",
            variant: "destructive",
          });
        }
      }

      const success = await checkIn(location || undefined, capturedPhoto || undefined);
      if (success) {
        toast({
          title: "Chấm công thành công",
          description: "Bạn đã chấm công vào làm!",
        });
        setCapturedPhoto(null);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể chấm công. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi chấm công.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      let location = null;
      if (useLocation) {
        location = await getCurrentLocation();
        if (!location) {
          toast({
            title: "Cảnh báo",
            description: "Không thể lấy vị trí hiện tại. Tiếp tục chấm công không có vị trí.",
            variant: "destructive",
          });
        }
      }

      const success = await checkOut(location || undefined, capturedPhoto || undefined);
      if (success) {
        toast({
          title: "Chấm công thành công",
          description: "Bạn đã chấm công tan làm!",
        });
        setCapturedPhoto(null);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể chấm công tan làm. Vui lòng chấm công vào làm trước.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi chấm công.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-success-foreground">Có mặt</Badge>;
      case 'late':
        return <Badge className="bg-warning text-warning-foreground">Muộn</Badge>;
      case 'absent':
        return <Badge variant="destructive">Vắng mặt</Badge>;
      default:
        return <Badge variant="secondary">Chưa chấm công</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Chào {user?.name}!
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
          <p className="text-lg font-semibold text-primary">{currentTime}</p>
        </div>

        {/* Today's Attendance Status */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Trạng thái hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trạng thái:</span>
                  {getStatusBadge(todayRecord.status)}
                </div>
                
                {todayRecord.checkIn && (
                  <div className="flex items-center gap-3 p-3 bg-success-light rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Vào làm: {todayRecord.checkIn.time}</p>
                      {todayRecord.checkIn.address && (
                        <p className="text-xs text-muted-foreground">{todayRecord.checkIn.address}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {todayRecord.checkOut && (
                  <div className="flex items-center gap-3 p-3 bg-accent-light rounded-lg">
                    <XCircle className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-medium">Tan làm: {todayRecord.checkOut.time}</p>
                      {todayRecord.checkOut.address && (
                        <p className="text-xs text-muted-foreground">{todayRecord.checkOut.address}</p>
                      )}
                      {todayRecord.workingHours && (
                        <p className="text-xs text-muted-foreground">
                          Làm việc: {todayRecord.workingHours} giờ
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Chưa có dữ liệu chấm công hôm nay</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Section */}
        {useCamera && (
          <Card className="shadow-medium">
            <CardContent className="p-4">
              <div className="space-y-4">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-64 object-cover rounded-lg bg-muted"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Chụp ảnh
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="flex-1">
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Captured Photo */}
        {capturedPhoto && (
          <Card className="shadow-medium">
            <CardContent className="p-4">
              <div className="space-y-4">
                <img 
                  src={capturedPhoto} 
                  alt="Ảnh chấm công" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCapturedPhoto(null)} className="flex-1">
                    Chụp lại
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Options */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Tùy chọn chấm công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">Sử dụng vị trí</span>
              </div>
              <Button
                variant={useLocation ? "default" : "outline"}
                size="sm"
                onClick={() => setUseLocation(!useLocation)}
              >
                {useLocation ? "Bật" : "Tắt"}
              </Button>
            </div>
            
            <div className="flex gap-2">
              {!useCamera && !capturedPhoto && (
                <Button variant="outline" onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Chụp ảnh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check In/Out Buttons */}
        <div className="space-y-3">
          {!todayRecord?.checkIn ? (
            <Button 
              onClick={handleCheckIn}
              disabled={isLoading}
              className="w-full h-14 text-lg bg-gradient-to-r from-success to-accent hover:from-success/90 hover:to-accent/90"
            >
              <Clock className="w-6 h-6 mr-2" />
              {isLoading ? "Đang chấm công..." : "Chấm công vào làm"}
            </Button>
          ) : !todayRecord?.checkOut ? (
            <Button 
              onClick={handleCheckOut}
              disabled={isLoading}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
            >
              <Clock className="w-6 h-6 mr-2" />
              {isLoading ? "Đang chấm công..." : "Chấm công tan làm"}
            </Button>
          ) : (
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="text-lg font-semibold text-foreground">Đã hoàn thành chấm công hôm nay</p>
              <p className="text-sm text-muted-foreground">Cảm ơn bạn đã tuân thủ quy định!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;