import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TrapPhoto {
  id: string;
  trapModel: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  battery: number;
  status: 'active' | 'low-battery' | 'offline';
}

interface WildlifePhoto {
  id: string;
  species: string;
  confidence: number;
  timestamp: Date;
  trapId: string;
  classified: boolean;
}

const Index = () => {
  const [isOffline] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<WildlifePhoto | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [trapPhotos, setTrapPhotos] = useState<TrapPhoto[]>([
    { 
      id: '1', 
      trapModel: 'Bushnell Trophy Cam', 
      location: { lat: 70.6632, lng: 147.9118 },
      timestamp: new Date('2024-12-20T14:30:00'),
      battery: 85,
      status: 'active'
    },
    { 
      id: '2', 
      trapModel: 'Reconyx HyperFire', 
      location: { lat: 70.6644, lng: 147.9205 },
      timestamp: new Date('2024-12-20T15:12:00'),
      battery: 32,
      status: 'low-battery'
    },
    { 
      id: '3', 
      trapModel: 'Browning Strike Force', 
      location: { lat: 70.6621, lng: 147.9089 },
      timestamp: new Date('2024-12-20T16:45:00'),
      battery: 68,
      status: 'active'
    },
  ]);

  const [wildlifePhotos] = useState<WildlifePhoto[]>([
    { 
      id: 'w1', 
      species: 'Белый медведь', 
      confidence: 94,
      timestamp: new Date('2024-12-20T08:15:00'),
      trapId: '1',
      classified: true
    },
    { 
      id: 'w2', 
      species: 'Песец', 
      confidence: 89,
      timestamp: new Date('2024-12-20T11:30:00'),
      trapId: '2',
      classified: true
    },
    { 
      id: 'w3', 
      species: 'Требует классификации', 
      confidence: 0,
      timestamp: new Date('2024-12-20T14:22:00'),
      trapId: '3',
      classified: false
    },
    { 
      id: 'w4', 
      species: 'Морж', 
      confidence: 91,
      timestamp: new Date('2024-12-20T16:05:00'),
      trapId: '1',
      classified: true
    },
  ]);

  const stats = {
    totalTraps: trapPhotos.length,
    activeTraps: trapPhotos.filter(t => t.status === 'active').length,
    totalPhotos: wildlifePhotos.length,
    classified: wildlifePhotos.filter(p => p.classified).length,
    avgBattery: Math.round(trapPhotos.reduce((sum, t) => sum + t.battery, 0) / trapPhotos.length),
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-primary';
    if (level > 20) return 'text-accent';
    return 'text-destructive';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-primary';
      case 'low-battery': return 'bg-accent';
      case 'offline': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  useEffect(() => {
    if (showCamera && !cameraStream) {
      startCamera();
      getCurrentLocation();
    }
    
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1920, height: 1080 } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('GPS error:', error);
          setGpsCoords({ lat: 70.6638, lng: 147.9152 });
        }
      );
    } else {
      setGpsCoords({ lat: 70.6638, lng: 147.9152 });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
      }
    }
  };

  const saveTrapData = () => {
    if (capturedImage && gpsCoords) {
      const newTrap: TrapPhoto = {
        id: String(trapPhotos.length + 1),
        trapModel: 'Определяется...',
        location: gpsCoords,
        timestamp: new Date(),
        battery: 100,
        status: 'active'
      };
      setTrapPhotos([newTrap, ...trapPhotos]);
      closeCamera();
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedImage(null);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-background font-['Roboto'] pb-20">
      <header className="sticky top-0 z-50 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <Icon name="Camera" size={28} className="text-primary" />
            <h1 className="text-xl font-bold">ФотоТрап Pro</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isOffline ? "secondary" : "default"} className="gap-1">
              <Icon name={isOffline ? "WifiOff" : "Wifi"} size={14} />
              {isOffline ? 'Оффлайн' : 'Онлайн'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Icon name="Satellite" size={14} className="text-primary" />
              GPS ±2м
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Camera" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Фотоловушки</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalTraps}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.activeTraps} активных
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Image" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Снимков</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalPhotos}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.classified} обработано
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Battery" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Батарея</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgBattery}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              средний уровень
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="MapPin" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Точность</span>
            </div>
            <div className="text-2xl font-bold">±2м</div>
            <div className="text-xs text-muted-foreground mt-1">
              GPS точность
            </div>
          </Card>
        </div>

        <Tabs defaultValue="traps" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="traps">Фотоловушки</TabsTrigger>
            <TabsTrigger value="photos">Снимки</TabsTrigger>
            <TabsTrigger value="map">Карта</TabsTrigger>
          </TabsList>

          <TabsContent value="traps" className="space-y-3 mt-4">
            {trapPhotos.map((trap) => (
              <Card key={trap.id} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{trap.trapModel}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Icon name="MapPin" size={14} />
                      <span>{trap.location.lat.toFixed(4)}, {trap.location.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(trap.status)}>
                    {trap.status === 'active' ? 'Активна' : trap.status === 'low-battery' ? 'Низкий заряд' : 'Оффлайн'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Батарея</span>
                    <span className={`font-semibold ${getBatteryColor(trap.battery)}`}>
                      {trap.battery}%
                    </span>
                  </div>
                  <Progress value={trap.battery} className="h-2" />
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Icon name="Clock" size={12} />
                    <span>
                      {trap.timestamp.toLocaleDateString('ru-RU')} {trap.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="photos" className="space-y-3 mt-4">
            {wildlifePhotos.map((photo) => (
              <Card 
                key={photo.id} 
                className="p-4 bg-card border-border cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">{photo.species}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Icon name="Camera" size={12} />
                      <span>Ловушка #{photo.trapId}</span>
                    </div>
                  </div>
                  
                  {photo.classified ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Icon name="Check" size={12} className="mr-1" />
                      {photo.confidence}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                      <Icon name="AlertCircle" size={12} className="mr-1" />
                      Не обработан
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Clock" size={12} />
                  <span>
                    {photo.timestamp.toLocaleDateString('ru-RU')} {photo.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <Card className="p-6 bg-card border-border">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name="Map" size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Интерактивная карта точек</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Визуализация {stats.totalTraps} фотоловушек на карте местности с привязкой координат GPS
                </p>
                <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-md">
                  {trapPhotos.map((trap) => (
                    <div key={trap.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(trap.status)}`} />
                        <span className="text-sm font-medium">{trap.trapModel}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {trap.location.lat.toFixed(4)}, {trap.location.lng.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-screen-xl mx-auto">
          <Button 
            onClick={() => setShowCamera(true)}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Icon name="Camera" size={24} className="mr-2" />
            Сфотографировать фотоловушку
          </Button>
        </div>
      </div>

      <Dialog open={showCamera} onOpenChange={closeCamera}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Идентификация фотоловушки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden">
              {!capturedImage ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-primary/50 rounded-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-primary rounded-full" />
                  </div>
                </>
              ) : (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Satellite" size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">GPS</span>
                </div>
                {gpsCoords ? (
                  <>
                    <div className="text-sm font-semibold">
                      {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">Точность ±2м</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Определение...</div>
                )}
              </div>
              
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Clock" size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Время</span>
                </div>
                <div className="text-sm font-semibold">
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>

            {!capturedImage ? (
              <Button 
                className="w-full h-12 bg-primary hover:bg-primary/90" 
                onClick={capturePhoto}
                disabled={!cameraStream}
              >
                <Icon name="Camera" size={20} className="mr-2" />
                Сделать снимок
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12" 
                  onClick={() => setCapturedImage(null)}
                >
                  <Icon name="RotateCcw" size={20} className="mr-2" />
                  Переснять
                </Button>
                <Button 
                  className="h-12 bg-primary hover:bg-primary/90" 
                  onClick={saveTrapData}
                >
                  <Icon name="Check" size={20} className="mr-2" />
                  Сохранить
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали снимка</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                <Icon name="Image" size={64} className="text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Вид</span>
                  <span className="font-semibold">{selectedPhoto.species}</span>
                </div>
                
                {selectedPhoto.classified && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Уверенность</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {selectedPhoto.confidence}%
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Фотоловушка</span>
                  <span className="font-semibold">#{selectedPhoto.trapId}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Время съёмки</span>
                  <span className="text-sm">
                    {selectedPhoto.timestamp.toLocaleDateString('ru-RU')} {selectedPhoto.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!selectedPhoto.classified && (
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Icon name="Tag" size={20} className="mr-2" />
                  Классифицировать вручную
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;