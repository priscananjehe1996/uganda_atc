export const VEHICLE_CLASS_COLORS: Record<string, string> = {
  "Motorcycles": "#FF6347",        // Tomato (Vibrant Red-Orange)
  "Saloon Cars & Taxis": "#00BFFF",// Deep Sky Blue
  "Light Goods": "#32CD32",        // Lime Green (Vibrant but natural)
  "Small Buses": "#FFD700",        // Gold
  "Medium Buses": "#FF8C00",       // Dark Orange
  "Large Buses": "#8A2BE2",        // Blue Violet
  "Light Trucks": "#FF69B4",       // Hot Pink
  "Medium Trucks": "#40E0D0",      // Turquoise
  "Heavy Trucks": "#7B68EE",       // Medium Slate Blue
  "Truck Trailers 5ax": "#2E8B57", // Sea Green
  "Truck Trailers 6ax": "#FF4500", // Orange Red
  "Truck Trailers 7ax": "#DA70D6", // Orchid
  "default": "#8e92a4"
};

export const getVehicleColor = (className: string) => {
  return VEHICLE_CLASS_COLORS[className] || VEHICLE_CLASS_COLORS["default"];
};

export const formatFractionalYearToDate = (fractionalYear: number) => {
  const year = Math.floor(fractionalYear);
  const fraction = fractionalYear - year;
  const startOfYear = new Date(year, 0, 1).getTime();
  const endOfYear = new Date(year + 1, 0, 1).getTime();
  const msInYear = endOfYear - startOfYear;
  
  const date = new Date(startOfYear + fraction * msInYear);
  
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const yearStr = date.getFullYear();
  
  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };
  
  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month} ${yearStr}`;
};
