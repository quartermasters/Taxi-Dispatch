// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

// Mock data for testing - expanded to 35+ drivers
const mockDrivers = [
  { id: '1', name: 'Ahmed Hassan', lat: 25.2048, lng: 55.2708, status: 'idle', phone: '+971501234567', email: 'ahmed@quartermasters.me', rating: 4.9, totalTrips: 234, vehicle: { model: 'Toyota Camry', plate: 'DUB-A123', color: 'White' } },
  { id: '2', name: 'Mohammed Ali', lat: 25.1972, lng: 55.2744, status: 'busy', phone: '+971501234568', email: 'mohammed@quartermasters.me', rating: 4.8, totalTrips: 189, vehicle: { model: 'Honda Accord', plate: 'DUB-B456', color: 'Black' } },
  { id: '3', name: 'Omar Saeed', lat: 25.2084, lng: 55.2719, status: 'idle', phone: '+971501234569', email: 'omar@quartermasters.me', rating: 4.7, totalTrips: 156, vehicle: { model: 'Nissan Altima', plate: 'DUB-C789', color: 'Silver' } },
  { id: '4', name: 'Khalid Ahmad', lat: 25.1951, lng: 55.2820, status: 'busy', phone: '+971501234570', email: 'khalid@quartermasters.me', rating: 4.9, totalTrips: 298, vehicle: { model: 'Hyundai Elantra', plate: 'DUB-D012', color: 'Blue' } },
  { id: '5', name: 'Rashid Nasser', lat: 25.2015, lng: 55.2650, status: 'offline', phone: '+971501234571', email: 'rashid@quartermasters.me', rating: 4.6, totalTrips: 87, vehicle: { model: 'Kia Optima', plate: 'DUB-E345', color: 'Red' } },
  { id: '6', name: 'Ali Mahmoud', lat: 25.2156, lng: 55.2794, status: 'idle', phone: '+971501234572', email: 'ali@quartermasters.me', rating: 4.8, totalTrips: 267, vehicle: { model: 'Toyota Corolla', plate: 'DUB-F678', color: 'White' } },
  { id: '7', name: 'Hassan Al-Zahra', lat: 25.1875, lng: 55.2588, status: 'busy', phone: '+971501234573', email: 'hassan@quartermasters.me', rating: 4.7, totalTrips: 145, vehicle: { model: 'Mazda 6', plate: 'DUB-G901', color: 'Red' } },
  { id: '8', name: 'Saeed Bin Rashid', lat: 25.2298, lng: 55.2901, status: 'idle', phone: '+971501234574', email: 'saeed@quartermasters.me', rating: 4.9, totalTrips: 321, vehicle: { model: 'Chevrolet Malibu', plate: 'DUB-H234', color: 'Blue' } },
  { id: '9', name: 'Youssef Al-Mansoori', lat: 25.1789, lng: 55.2433, status: 'offline', phone: '+971501234575', email: 'youssef@quartermasters.me', rating: 4.5, totalTrips: 98, vehicle: { model: 'Ford Focus', plate: 'DUB-I567', color: 'Silver' } },
  { id: '10', name: 'Abdullah Al-Fahim', lat: 25.2067, lng: 55.2812, status: 'busy', phone: '+971501234576', email: 'abdullah@quartermasters.me', rating: 4.8, totalTrips: 198, vehicle: { model: 'Volkswagen Passat', plate: 'DUB-J890', color: 'Black' } },
  { id: '11', name: 'Tariq Al-Shamsi', lat: 25.1934, lng: 55.2699, status: 'idle', phone: '+971501234577', email: 'tariq@quartermasters.me', rating: 4.7, totalTrips: 176, vehicle: { model: 'Peugeot 508', plate: 'DUB-K123', color: 'Gray' } },
  { id: '12', name: 'Nasser Al-Blooshi', lat: 25.2189, lng: 55.2567, status: 'busy', phone: '+971501234578', email: 'nasser@quartermasters.me', rating: 4.9, totalTrips: 289, vehicle: { model: 'Skoda Octavia', plate: 'DUB-L456', color: 'White' } },
  { id: '13', name: 'Majid Al-Ketbi', lat: 25.1823, lng: 55.2745, status: 'idle', phone: '+971501234579', email: 'majid@quartermasters.me', rating: 4.6, totalTrips: 134, vehicle: { model: 'Renault Megane', plate: 'DUB-M789', color: 'Blue' } },
  { id: '14', name: 'Hamdan Al-Muhairi', lat: 25.2134, lng: 55.2623, status: 'offline', phone: '+971501234580', email: 'hamdan@quartermasters.me', rating: 4.8, totalTrips: 203, vehicle: { model: 'Seat Leon', plate: 'DUB-N012', color: 'Red' } },
  { id: '15', name: 'Suhail Al-Zaabi', lat: 25.1967, lng: 55.2856, status: 'busy', phone: '+971501234581', email: 'suhail@quartermasters.me', rating: 4.9, totalTrips: 356, vehicle: { model: 'Mitsubishi Lancer', plate: 'DUB-O345', color: 'Silver' } },
  { id: '16', name: 'Faisal Al-Hammadi', lat: 25.2245, lng: 55.2478, status: 'idle', phone: '+971501234582', email: 'faisal@quartermasters.me', rating: 4.7, totalTrips: 167, vehicle: { model: 'Subaru Legacy', plate: 'DUB-P678', color: 'Black' } },
  { id: '17', name: 'Khalifa Al-Suwaidi', lat: 25.1856, lng: 55.2712, status: 'busy', phone: '+971501234583', email: 'khalifa@quartermasters.me', rating: 4.8, totalTrips: 245, vehicle: { model: 'Opel Insignia', plate: 'DUB-Q901', color: 'White' } },
  { id: '18', name: 'Sultan Al-Dhaheri', lat: 25.2078, lng: 55.2534, status: 'idle', phone: '+971501234584', email: 'sultan@quartermasters.me', rating: 4.6, totalTrips: 112, vehicle: { model: 'Infiniti Q50', plate: 'DUB-R234', color: 'Gray' } },
  { id: '19', name: 'Rashid Al-Qasimi', lat: 25.1923, lng: 55.2789, status: 'offline', phone: '+971501234585', email: 'rashid2@quartermasters.me', rating: 4.5, totalTrips: 89, vehicle: { model: 'Lexus ES', plate: 'DUB-S567', color: 'Blue' } },
  { id: '20', name: 'Salem Al-Mansouri', lat: 25.2167, lng: 55.2645, status: 'busy', phone: '+971501234586', email: 'salem@quartermasters.me', rating: 4.9, totalTrips: 278, vehicle: { model: 'Acura TLX', plate: 'DUB-T890', color: 'Red' } },
  { id: '21', name: 'Obaid Al-Falasi', lat: 25.1789, lng: 55.2567, status: 'idle', phone: '+971501234587', email: 'obaid@quartermasters.me', rating: 4.7, totalTrips: 189, vehicle: { model: 'Cadillac ATS', plate: 'DUB-U123', color: 'Black' } },
  { id: '22', name: 'Juma Al-Ghurair', lat: 25.2201, lng: 55.2823, status: 'busy', phone: '+971501234588', email: 'juma@quartermasters.me', rating: 4.8, totalTrips: 234, vehicle: { model: 'Lincoln MKZ', plate: 'DUB-V456', color: 'Silver' } },
  { id: '23', name: 'Saif Al-Nuaimi', lat: 25.1945, lng: 55.2456, status: 'idle', phone: '+971501234589', email: 'saif@quartermasters.me', rating: 4.6, totalTrips: 156, vehicle: { model: 'Genesis G80', plate: 'DUB-W789', color: 'White' } },
  { id: '24', name: 'Marwan Al-Otaiba', lat: 25.2089, lng: 55.2734, status: 'offline', phone: '+971501234590', email: 'marwan@quartermasters.me', rating: 4.4, totalTrips: 67, vehicle: { model: 'Volvo S60', plate: 'DUB-X012', color: 'Gray' } },
  { id: '25', name: 'Ahmad Al-Rostamani', lat: 25.1834, lng: 55.2598, status: 'busy', phone: '+971501234591', email: 'ahmad@quartermasters.me', rating: 4.9, totalTrips: 312, vehicle: { model: 'Jaguar XE', plate: 'DUB-Y345', color: 'Blue' } },
  { id: '26', name: 'Mubarak Al-Shamsi', lat: 25.2156, lng: 55.2667, status: 'idle', phone: '+971501234592', email: 'mubarak@quartermasters.me', rating: 4.8, totalTrips: 198, vehicle: { model: 'Audi A4', plate: 'DUB-Z678', color: 'Red' } },
  { id: '27', name: 'Zayed Al-Nahyan', lat: 25.1978, lng: 55.2789, status: 'busy', phone: '+971501234593', email: 'zayed@quartermasters.me', rating: 4.7, totalTrips: 223, vehicle: { model: 'BMW 3 Series', plate: 'DUB-AA901', color: 'Black' } },
  { id: '28', name: 'Mansour Al-Maktoum', lat: 25.2123, lng: 55.2523, status: 'idle', phone: '+971501234594', email: 'mansour@quartermasters.me', rating: 4.9, totalTrips: 345, vehicle: { model: 'Mercedes C-Class', plate: 'DUB-BB234', color: 'Silver' } },
  { id: '29', name: 'Hamad Al-Thani', lat: 25.1867, lng: 55.2645, status: 'offline', phone: '+971501234595', email: 'hamad@quartermasters.me', rating: 4.3, totalTrips: 45, vehicle: { model: 'Porsche Macan', plate: 'DUB-CC567', color: 'White' } },
  { id: '30', name: 'Rashed Al-Mulla', lat: 25.2045, lng: 55.2712, status: 'busy', phone: '+971501234596', email: 'rashed@quartermasters.me', rating: 4.8, totalTrips: 267, vehicle: { model: 'Tesla Model 3', plate: 'DUB-DD890', color: 'Gray' } },
  { id: '31', name: 'Fahad Al-Sabah', lat: 25.1923, lng: 55.2578, status: 'idle', phone: '+971501234597', email: 'fahad@quartermasters.me', rating: 4.7, totalTrips: 178, vehicle: { model: 'Range Rover Evoque', plate: 'DUB-EE123', color: 'Blue' } },
  { id: '32', name: 'Waleed Al-Rashid', lat: 25.2178, lng: 55.2834, status: 'busy', phone: '+971501234598', email: 'waleed@quartermasters.me', rating: 4.9, totalTrips: 298, vehicle: { model: 'Maserati Ghibli', plate: 'DUB-FF456', color: 'Red' } },
  { id: '33', name: 'Nawaf Al-Sabah', lat: 25.1845, lng: 55.2456, status: 'idle', phone: '+971501234599', email: 'nawaf@quartermasters.me', rating: 4.6, totalTrips: 143, vehicle: { model: 'Bentley Flying Spur', plate: 'DUB-GG789', color: 'Black' } },
  { id: '34', name: 'Bader Al-Humaid', lat: 25.2067, lng: 55.2689, status: 'offline', phone: '+971501234600', email: 'bader@quartermasters.me', rating: 4.5, totalTrips: 89, vehicle: { model: 'Ferrari Portofino', plate: 'DUB-HH012', color: 'Red' } },
  { id: '35', name: 'Talal Al-Ghanim', lat: 25.1956, lng: 55.2756, status: 'busy', phone: '+971501234601', email: 'talal@quartermasters.me', rating: 4.8, totalTrips: 234, vehicle: { model: 'Lamborghini Huracan', plate: 'DUB-II345', color: 'Yellow' } },
  { id: '36', name: 'Yousef Al-Otaibi', lat: 25.2134, lng: 55.2612, status: 'idle', phone: '+971501234602', email: 'yousef@quartermasters.me', rating: 4.7, totalTrips: 189, vehicle: { model: 'McLaren 570S', plate: 'DUB-JJ678', color: 'Orange' } },
  { id: '37', name: 'Khalid Al-Dosari', lat: 25.1889, lng: 55.2723, status: 'busy', phone: '+971501234603', email: 'khalid2@quartermasters.me', rating: 4.9, totalTrips: 345, vehicle: { model: 'Aston Martin DB11', plate: 'DUB-KK901', color: 'Silver' } },
  { id: '38', name: 'Meshal Al-Thani', lat: 25.2089, lng: 55.2545, status: 'idle', phone: '+971501234604', email: 'meshal@quartermasters.me', rating: 4.6, totalTrips: 167, vehicle: { model: 'Rolls Royce Ghost', plate: 'DUB-LL234', color: 'Black' } }
];

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Use mock data for testing - fallback to API data if available
  const displayDrivers = (drivers && Array.isArray(drivers) && drivers.length > 0) ? drivers : mockDrivers;

  const filteredDrivers = displayDrivers.filter((driver: any) => 
    !searchTerm || 
    (driver.name || driver.users?.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone || driver.users?.phone)?.includes(searchTerm) ||
    (driver.vehicle?.plate || driver.vehicles?.plate)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastSeen = (driver: any) => {
    if (!driver.drivers?.updatedAt) return 'Never';
    const lastSeen = new Date(driver.drivers.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center" data-testid="page-title">
              <i className="fas fa-users-cog mr-3 text-primary"></i>
              Driver Management
            </h2>
            <p className="text-sm text-muted-foreground flex items-center">
              <i className="fas fa-chart-network mr-2"></i>
              Monitor and manage driver fleet
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-drivers"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Drivers Table */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-2">Loading drivers...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Trips</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground" data-testid="empty-drivers">
                        {searchTerm ? 'No drivers match your search' : 'No drivers found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver: any) => {
                      const driverId = driver.id || driver.drivers?.id;
                      const driverName = driver.name || driver.users?.name;
                      const driverPhone = driver.phone || driver.users?.phone;
                      const driverEmail = driver.email || driver.users?.email;
                      const driverStatus = driver.status || driver.drivers?.status;
                      const vehicle = driver.vehicle || driver.vehicles;
                      
                      return (
                        <TableRow key={driverId} data-testid={`driver-row-${driverId}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {driverName?.substring(0, 2).toUpperCase() || 'UN'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground" data-testid={`driver-name-${driverId}`}>
                                  {driverName || 'Unknown Driver'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {driverId?.slice(-8) || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-foreground" data-testid={`driver-phone-${driverId}`}>
                                {driverPhone || 'N/A'}
                              </p>
                              <p className="text-muted-foreground" data-testid={`driver-email-${driverId}`}>
                                {driverEmail || 'No email'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`driver-vehicle-${driverId}`}>
                            {vehicle ? (
                              <div className="text-sm">
                                <p className="text-foreground">{vehicle.model}</p>
                                <p className="text-muted-foreground">{vehicle.plate}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No vehicle</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={driverStatus || 'offline'} 
                              type="driver"
                              data-testid={`driver-status-${driverId}`}
                            />
                          </TableCell>
                          <TableCell data-testid={`driver-rating-${driverId}`}>
                            <div className="flex items-center space-x-1">
                              <span className="text-foreground">{driver.rating || driver.drivers?.rating || '5.0'}</span>
                              <i className="fas fa-star text-yellow-500 text-xs"></i>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`driver-trips-${driverId}`}>
                            {driver.totalTrips || driver.drivers?.totalTrips || 0}
                          </TableCell>
                          <TableCell data-testid={`driver-last-seen-${driverId}`}>
                            {driver.drivers ? getLastSeen(driver) : '2 minutes ago'}
                          </TableCell>
                          <TableCell data-testid={`driver-location-${driverId}`}>
                            {driver.lat && driver.lng ? (
                              <span className="text-sm text-muted-foreground">
                                {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                              </span>
                            ) : driver.drivers?.lastLat && driver.drivers?.lastLng ? (
                              <span className="text-sm text-muted-foreground">
                                {parseFloat(driver.drivers.lastLat).toFixed(4)}, {parseFloat(driver.drivers.lastLng).toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
