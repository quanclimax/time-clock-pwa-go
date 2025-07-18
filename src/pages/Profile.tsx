import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, Save, Edit3, Camera } from 'lucide-react';
import Layout from '@/components/Layout';

const Profile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    position: user?.position || '',
    avatar: user?.avatar || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    'IT',
    'HR',
    'Kế toán',
    'Marketing',
    'Kinh doanh',
    'Sản xuất',
    'Hành chính',
  ];

  const positions = [
    'Nhân viên',
    'Trưởng nhóm',
    'Quản lý',
    'Giám đốc',
    'Thực tập sinh',
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department || !formData.position) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        position: formData.position,
        avatar: formData.avatar,
      });
      
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật!",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      position: user?.position || '',
      avatar: user?.avatar || '',
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handleChange('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Profile Header */}
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={isEditing ? formData.avatar : user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                <p className="text-muted-foreground">{user.position} - {user.department}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thông tin chi tiết</CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    {isEditing ? (
                      <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.department}
                        className="pl-10"
                        disabled
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Chức vụ</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    {isEditing ? (
                      <Select value={formData.position} onValueChange={(value) => handleChange('position', value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                              {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.position}
                        className="pl-10"
                        disabled
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            {isEditing && (
              <CardFooter className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>

        {/* Account Actions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Đăng xuất</p>
                <p className="text-sm text-muted-foreground">
                  Thoát khỏi tài khoản hiện tại
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={logout}
              >
                Đăng xuất
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="shadow-soft border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Ứng dụng Chấm công</h3>
              <p className="text-sm text-muted-foreground">
                Phiên bản 1.0.0 - Được phát triển với ❤️
              </p>
              <p className="text-xs text-muted-foreground">
                © 2024 Công ty ABC. Bảo lưu mọi quyền.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;