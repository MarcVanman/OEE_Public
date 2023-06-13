import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useMachineContext from '../hooks/use-machine-context';
import { Tab, TabList, Text } from "@tremor/react";
import { MultiSelectBox } from "@tremor/react";
import { LineChart, BarChart } from "@tremor/react";
import { DateRangePicker } from "@tremor/react";
import { da } from "date-fns/locale";
import dayjs from 'dayjs';
import './Dashboard.css';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import duration from 'dayjs/plugin/duration';
import DashboardList from './DashboardList';
import DashboardBarChart from './DashboardBarChart';
dayjs.extend(duration);
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)


// Calculates the production time in hours between two given timestamps
const getProductionTime = (startTime, endTime) => {
  const start = dayjs(startTime, 'HH:mm');
  const end = dayjs(endTime, 'HH:mm');
  const durationInMinutes = end.diff(start, 'minute');
  return durationInMinutes
};

const getVarenummerByPOrder = (pOrder, orders) => {
  const order = orders.find((order) => order.P_Order === pOrder);
  return order ? order.Varenummer : null;
};

function Dashboard() {

  const today = new Date();
  const aWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

  // State variables
  const [machines, setMachines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stopRegistrations, setStopRegistrations] = useState([]);
  const [dailyNumbers, setDailyNumbers] = useState([]);
  const [filteredStopRegistrations, setFilteredStopRegistrations] = useState([]);
  const [filteredDailyNumbers, setFilteredDailyNumbers] = useState([]);
  const [dateSelection, setDateSelection] = useState([
    aWeekAgo,
    today,
  ]);

  const [varenummerActive, setVarenummerActive] = useState(true);
  const [pOrderActive, setPOrderActive] = useState(false);
  const [machineActive, setMachineActive] = useState(false);

  const [utilization, setUtilization] = useState([]);
  const [averageUtilization, setAverageUtilization] = useState(0);
  const [machineUtilizationHistory, setMachineUtilizationHistory] = useState([]);

  const [qualityRatio, setQualityRatio] = useState([]);
  const [averageQualityRatio, setAverageQualityRatio] = useState(0);
  const [qualityRatioHistory, setQualityRatioHistory] = useState([]);

  const [performance, setPerformance] = useState([]);
  const [averagePerformance, setAveragePerformance] = useState(0);
  const [performanceHistory, setPerformanceHistory] = useState([]);

  const [stopsByReason, setStopsByReason] = useState([]);
  const [stopsByReasonInMinutes, setStopsByReasonInMinutes] = useState([]);

  const [totalProducedParts, setTotalProducedParts] = useState(0);
  const [totalDiscardedParts, setTotalDiscardedParts] = useState(0);
  const [totalProductionTime, setTotalProductionTime] = useState(0);
  const [totalStopTime, setTotalStopTime] = useState(0);
  const [effectiveProductionTime, setEffectiveProductionTime] = useState(0);
  const [producedPerHour, setProducedPerHour] = useState(0);
  const [discardedPerHour, setDiscardedPerHour] = useState(0);

  // const [producedPartsPerHour, setProducedPartsPerHour] = useState(0);
  const [OEE, setOEE] = useState([]);

  const { getAllItems } = useMachineContext();

  // Set the filters if they are comming from the machine list
  const getInitialSelectedPOrders = useCallback(
    (orders, machineId) => {
      const ordersOnMachine = orders.filter((pOrder) => pOrder.Machine === machineId);

      // Keep only pOrder which appears in dailyNumbers.P_Order
      const filteredOrders = ordersOnMachine.filter((pOrder) => dailyNumbers.some((dailyNumber) => dailyNumber.P_Order === pOrder.P_Order));

      return filteredOrders;
    },
    [dailyNumbers]);

  const getInitialSelectedVarenummer = useCallback((orders, machineId) => {
    const ordersOnMachine = orders.filter((pOrder) => pOrder.Machine === machineId);

    // Keep only pOrder which appears in dailyNumbers
    const filteredOrders = ordersOnMachine.filter((pOrder) => dailyNumbers.some((dailyNumber) => dailyNumber.P_Order === pOrder.P_Order));

    const filteredVarenumre = [...new Set(filteredOrders.map((order) => order.Varenummer))];

    return filteredVarenumre;
  }, [dailyNumbers]);


  const location = useLocation();
  const initialSelectedMachines = location.state?.machine ? [location.state.machine] : [];
  const [selectedMachines, setSelectedMachines] = useState(initialSelectedMachines);
  const [selectedPOrders, setSelectedPOrders] = useState([]);
  const [selectedVarenummer, setSelectedVarenummer] = useState([]);

  // Fetches all items from the context
  const [error, setError] = useState(null);

  const fetchAllItems = useCallback(async () => {
    try {
      console.log('Fetching all items');
      const machinesData = await getAllItems({ table: 'OEE-Machines', all: true });
      const stopRegistrations = await getAllItems({ table: 'OEE-Stop-Registrations', all: true });
      const ordersData = await getAllItems({ table: 'OEE-P-Orders', all: true });
      const dailyNumbers = await getAllItems({ table: 'OEE-Daily-Numbers', all: true });
      console.log('All items fetched');
      setMachines(machinesData);
      setStopRegistrations(stopRegistrations);
      setOrders(ordersData);
      setDailyNumbers(dailyNumbers);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
    }
  }, [getAllItems]);

  // Fetches all items on component mount
  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  // Update selectedPOrders when orders are fetched
  useEffect(() => {
    if (location.state?.machine) {
      const initialSelectedPOrders = getInitialSelectedPOrders(orders, location.state.machine.id);
      const initialSelectedVarenummer = getInitialSelectedVarenummer(orders, location.state.machine.id);
      setSelectedVarenummer(initialSelectedVarenummer);
      setSelectedPOrders(initialSelectedPOrders);
      setSelectedMachines([location.state.machine]);
    }
  }, [orders, location.state, getInitialSelectedPOrders, getInitialSelectedVarenummer]);

  const filterData = useCallback(
    (data, startDate, endDate) => {
      return data.filter((item) => {
        // Parse the item.Date in Copenhagen timezone
        const itemDate = dayjs(item.Date, 'DD-MM-YYYY');
        // Compare the dates
        const isWithinDateRange = itemDate.isSameOrAfter(startDate) && itemDate.isSameOrBefore(endDate);
        const isSelectedMachine = selectedMachines.some((machine) => machine.id === item['Machine']);
        const isSelectedPOrder = selectedPOrders.some((pOrder) => pOrder.P_Order === item['P_Order']);
        const isSelectedVarenummer = selectedVarenummer.some((varenummer) => varenummer === item['Varenummer']);
        return isWithinDateRange && isSelectedMachine && isSelectedPOrder && isSelectedVarenummer;
      });
    },
    [selectedMachines, selectedPOrders, selectedVarenummer]
  );

  // Filters the stopRegistrations and dailyNumbers data based on the dateSelection
  useEffect(() => {
    const filteredSR = filterData(stopRegistrations, dateSelection[0], dateSelection[1]);
    const filteredDN = filterData(dailyNumbers, dateSelection[0], dateSelection[1]);

    setFilteredStopRegistrations(filteredSR);
    setFilteredDailyNumbers(filteredDN);
  }, [stopRegistrations, dailyNumbers, dateSelection, filterData, selectedMachines, selectedPOrders, selectedVarenummer]);



  const calculateVarenummerUtilization = useCallback((filteredDN, filteredSR, orders, type) => {
    // If filteredDN and filteredSR are undefined, use the filtered data from state

    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    let uniqueVarenummers = null;

    if (type === 'history') {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))

    }
    else {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))
        .filter((varenummer) => filteredDNToUse.some((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer));
    }


    const varenummerUtilization = uniqueVarenummers.map((varenummer) => {
      const varenummerDailyNumbers = filteredDNToUse.filter((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer);
      const varenummerStops = filteredSRToUse.filter((sr) => getVarenummerByPOrder(sr.P_Order, orders) === varenummer);

      const totalProductionTime = varenummerDailyNumbers.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);
      const totalStopTime = varenummerStops.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);
      const utilization = totalProductionTime === 0 ? 0 : ((totalProductionTime - totalStopTime) / totalProductionTime) * 100;

      return {
        id: varenummer,
        utilization: utilization
      };
    });

    return varenummerUtilization;
  }, [filteredDailyNumbers, filteredStopRegistrations]);

  const calculatePOrderUtilization = useCallback((filteredDN, filteredSR, orders, type) => {
    // If filteredDN and filteredSR are undefined, use the filtered data from state
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    let uniquePOrders = null;

    if (type === 'history') {
      uniquePOrders = Array.from(new Set(orders.map((order) => order.P_Order)))

    }
    else {
      uniquePOrders = Array.from(new Set(orders.map((order) => order.P_Order)))
        .filter((pOrder) => filteredDNToUse.some((dn) => dn.P_Order === pOrder));
    }

    const pOrderUtilization = uniquePOrders.map((pOrder) => {
      const pOrderDailyNumbers = filteredDNToUse.filter((dn) => dn.P_Order === pOrder);
      const pOrderStops = filteredSRToUse.filter((sr) => sr.P_Order === pOrder);

      const totalProductionTime = pOrderDailyNumbers.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);
      const totalStopTime = pOrderStops.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);
      const utilization = totalProductionTime === 0 ? 0 : ((totalProductionTime - totalStopTime) / totalProductionTime) * 100;

      return {
        id: pOrder,
        utilization: utilization
      };
    });

    return pOrderUtilization;
  }, [filteredDailyNumbers, filteredStopRegistrations]);

  const calculateMachineUtilization = useCallback((filteredDN, filteredSR) => {
    // If filteredDN and filteredSR are undefined, use the filtered data from state
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    // Calculate the machine utilization for each machine
    const machineUtilization = selectedMachines.map((machine) => {
      // Use the filterData function for the current machine and P-order
      const machineDailyNumbers = filteredDNToUse.filter((dn) => dn.Machine === machine.id);
      const machineStops = filteredSRToUse.filter((sr) => sr.Machine === machine.id);

      // Calculate the total production time and total stop time for the current machine
      const totalProductionTime = machineDailyNumbers.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);
      const totalStopTime = machineStops.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);
      // Calculate the machine utilization for the current machine and round to 1 decimal
      const utilization = totalProductionTime === 0 ? 0 : ((totalProductionTime - totalStopTime) / totalProductionTime) * 100;
      return {
        id: machine.name,
        utilization: utilization
      };
    });

    return machineUtilization;
  }, [filteredDailyNumbers, filteredStopRegistrations, selectedMachines]);

  const calculateAverageUtilization = useCallback((utilization) => {
    const totalUtilization = utilization.reduce((acc, item) => acc + parseFloat(item.utilization), 0);
    const avgUtilization = utilization.length === 0 ? 0 : (totalUtilization / utilization.length).toFixed(1);
    return avgUtilization;
  },
    []);

  const calculateUtilizationHistory = useCallback((utilizationFunction) => {
    // Calculate the historical machine utilization for each machine selected in the date range
    let currentDate = dayjs(dateSelection[0]);
    const endDate = dayjs(dateSelection[1]);
    const varenummerUtilizationHistory = [];

    // Loop through each day in the date range and calculate the machine utilization
    while (currentDate.isSameOrBefore(endDate)) {
      // Use the filterData function for the current date
      const filteredDN = filteredDailyNumbers.filter((dn) => { return dayjs(dn.Date, 'DD-MM-YYYY').isSame(currentDate); });
      const filteredSR = filteredStopRegistrations.filter((sr) => { return dayjs(sr.Date, 'DD-MM-YYYY').isSame(currentDate); });

      const utilization = utilizationFunction(filteredDN, filteredSR, orders, 'history');

      // Create an object with the date and the machine utilizations as properties
      const utilizationObj = {
        Date: currentDate.format('DD-MM-YYYY'),
      };
      utilization.forEach((obj) => {
        utilizationObj[obj.id] = parseFloat(obj.utilization);
      });
      // Add the utilization object for the current date to the machineUtilizationHistory array
      varenummerUtilizationHistory.push(utilizationObj);

      // Increment the date by 1 day
      currentDate = currentDate.add(1, 'day');
    }

    return varenummerUtilizationHistory;
  }, [dateSelection, filteredDailyNumbers, filteredStopRegistrations, orders]);






  const calculateQualityRatio = (data) => {
    const totalProducedGoodParts = data.reduce((acc, dn) => {
      return acc + parseInt(dn.Produced_parts);
    }, 0);

    const totalDiscardedParts = data.reduce((acc, dn) => {
      return acc + parseInt(dn.Discarded_parts);
    }, 0);

    const ratio = totalProducedGoodParts === 0 ? 0 : (totalProducedGoodParts / (totalDiscardedParts + totalProducedGoodParts) * 100);
    return ratio;
  };

  const calculateVarenummerQuality = useCallback((filteredDN, orders, type) => {
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;

    let uniqueVarenummers = null;

    if (type === 'history') {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))

    }
    else {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))
        .filter((varenummer) => filteredDNToUse.some((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer));
    }


    const qualityRatio = uniqueVarenummers.map((varenummer) => {
      const varenummerDailyNumbers = filteredDNToUse.filter((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer);
      const ratio = calculateQualityRatio(varenummerDailyNumbers);

      return {
        id: varenummer,
        quality: ratio
      };
    });

    return qualityRatio;

  }, [filteredDailyNumbers]);

  const calculatePOrderQuality = useCallback((filteredDN) => {
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;

    const qualityRatio = selectedPOrders.map((pOrder) => {

      const pOrderDailyNumbers = filteredDNToUse.filter((dn) => dn.P_Order === pOrder.P_Order);
      const ratio = calculateQualityRatio(pOrderDailyNumbers);

      return {
        id: pOrder.P_Order,
        quality: ratio
      };
    });

    return qualityRatio;

  }, [filteredDailyNumbers, selectedPOrders]);

  const calculateMachineQuality = useCallback((filteredDN) => {
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;

    const qualityRatio = selectedMachines.map((machine) => {

      const machineDailyNumbers = filteredDNToUse.filter((dn) => dn.Machine === machine.id);
      const ratio = calculateQualityRatio(machineDailyNumbers);

      return {
        id: machine.name,
        quality: ratio
      };
    });

    return qualityRatio;

  }, [filteredDailyNumbers, selectedMachines]);

  const calculateAverageQualityRatio = useCallback((qualityRatio) => {
    const totalQualityRatio = qualityRatio.reduce((acc, item) => acc + parseFloat(item.quality), 0);
    const avgQualityRatio = qualityRatio.length === 0 ? 0 : (totalQualityRatio / qualityRatio.length).toFixed(1);
    return avgQualityRatio;
  },
    []);

  const calculateQualityHistory = useCallback((qualityFunction) => {
    // Calculate the historical machine utilization for each machine selected in the date range
    let currentDate = dayjs(dateSelection[0]);
    const endDate = dayjs(dateSelection[1]);
    const qualityHistory = [];

    // Loop through each day in the date range and calculate the machine utilization
    while (currentDate.isSameOrBefore(endDate)) {
      // Use the filterData function for the current date
      const filteredDN = dailyNumbers.filter((dn) => { return dayjs(dn.Date, 'DD-MM-YYYY').isSame(currentDate); });
      const quality = qualityFunction(filteredDN, orders, 'history');

      // Create an object with the date and the machine utilizations as properties
      const qualityObj = {
        Date: currentDate.format('DD-MM-YYYY'),
      };

      quality.forEach((obj) => {
        qualityObj[obj.id] = parseFloat(obj.quality);
      });

      // Add the utilization object for the current date to the machineUtilizationHistory array
      qualityHistory.push(qualityObj);

      // Increment the date by 1 day
      currentDate = currentDate.add(1, 'day');
    }
    return qualityHistory;
  }, [dateSelection, dailyNumbers, orders]);



  const calculateVarenummerPerformance = useCallback((filteredDN, filteredSR, orders, type) => {
    // If filteredDN and filteredSR are undefined, use the filtered data from state

    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    let uniqueVarenummers = null;

    if (type === 'history') {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))

    }
    else {
      uniqueVarenummers = Array.from(new Set(orders.map((order) => order.Varenummer)))
        .filter((varenummer) => filteredDNToUse.some((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer));
    }

    const varenummerPerformance = uniqueVarenummers.map((varenummer) => {
      const varenummerDailyNumbers = filteredDNToUse.filter((dn) => getVarenummerByPOrder(dn.P_Order, orders) === varenummer);
      const varenummerStops = filteredSRToUse.filter((sr) => getVarenummerByPOrder(sr.P_Order, orders) === varenummer);

      const totalProductionTime = varenummerDailyNumbers.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);

      const totalStopTime = varenummerStops.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);

      const actualProductionTime = totalProductionTime - totalStopTime;
      const totalProducedParts = varenummerDailyNumbers.reduce((acc, dn) => {
        return acc + parseInt(dn.Produced_parts);
      }, 0);

      const producedPartsPerHour = actualProductionTime > 0 ? totalProducedParts / (actualProductionTime / 60) : 0;

      const filteredPOrders = orders.filter((order) => order.Varenummer === varenummer);
      const totalValidatedPerHour = filteredPOrders.reduce((acc, order) => {
        return acc + parseFloat(order.Validated_per_hour);
      }, 0);

      const averageValidatedPerHour = filteredPOrders.length > 0 ? totalValidatedPerHour / filteredPOrders.length : 0;

      const validatedPerHour = averageValidatedPerHour;
      const ratio = validatedPerHour > 0 ? (producedPartsPerHour / validatedPerHour) * 100 : 0;

      return {
        id: varenummer,
        performance: ratio,
      };
    });
    return varenummerPerformance;
  }, [filteredDailyNumbers, filteredStopRegistrations]);

  const calculatePOrderPerformance = useCallback((filteredDN, filteredSR) => {
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    const performance = selectedPOrders.map((pOrder) => {
      const pOrderFilteredDN = filteredDNToUse.filter((dn) => dn.P_Order === pOrder.P_Order);
      const pOrderFilteredSR = filteredSRToUse.filter((sr) => sr.P_Order === pOrder.P_Order);

      const totalProductionTime = pOrderFilteredDN.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);

      const totalStopTime = pOrderFilteredSR.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);

      const actualProductionTime = totalProductionTime - totalStopTime;
      const totalProducedParts = pOrderFilteredDN.reduce((acc, dn) => {
        return acc + parseInt(dn.Produced_parts);
      }, 0);

      const producedPartsPerHour = actualProductionTime > 0 ? totalProducedParts / (actualProductionTime / 60) : 0;

      const validatedPerHour = parseFloat(pOrder.Validated_per_hour);
      const ratio = validatedPerHour > 0 ? (producedPartsPerHour / validatedPerHour) * 100 : 0;

      return {
        id: pOrder.P_Order,
        performance: ratio,
      };
    });
    return performance;
  }, [filteredDailyNumbers, filteredStopRegistrations, selectedPOrders]);

  const calculateMachinePerformance = useCallback((filteredDN, filteredSR) => {
    const filteredDNToUse = filteredDN !== undefined ? filteredDN : filteredDailyNumbers;
    const filteredSRToUse = filteredSR !== undefined ? filteredSR : filteredStopRegistrations;

    const performance = selectedMachines.map((machine) => {
      const machineFilteredDN = filteredDNToUse.filter((dn) => dn.Machine === machine.id);
      const machineFilteredSR = filteredSRToUse.filter((sr) => sr.Machine === machine.id);

      const totalProductionTime = machineFilteredDN.reduce((acc, dn) => {
        return acc + getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      }, 0);

      const totalStopTime = machineFilteredSR.reduce((acc, sr) => {
        return acc + getProductionTime(sr.Start_time, sr.End_time);
      }, 0);

      const actualProductionTime = totalProductionTime - totalStopTime;
      const totalProducedParts = machineFilteredDN.reduce((acc, dn) => {
        return acc + parseInt(dn.Produced_parts);
      }, 0);

      const producedPartsPerHour = actualProductionTime > 0 ? totalProducedParts / (actualProductionTime / 60) : 0;

      const filteredPOrders = orders.filter((order) => order.Machine === machine.id);
      const totalValidatedPerHour = filteredPOrders.reduce((acc, order) => {
        return acc + parseFloat(order.Validated_per_hour);
      }, 0);

      const averageValidatedPerHour = filteredPOrders.length > 0 ? totalValidatedPerHour / filteredPOrders.length : 0;

      const validatedPerHour = averageValidatedPerHour;
      const ratio = validatedPerHour > 0 ? (producedPartsPerHour / validatedPerHour) * 100 : 0;

      return {
        id: machine.name,
        performance: ratio,
      };
    });

    return performance;

  }, [filteredDailyNumbers, filteredStopRegistrations, selectedMachines, orders]);

  const calculatePerformanceAverage = useCallback((performance) => {
    const totalPerformance = performance.reduce((acc, item) => acc + parseFloat(item.performance), 0);
    const avgPerformance = performance.length === 0 ? 0 : (totalPerformance / performance.length).toFixed(1);
    return avgPerformance;
  }
    , []);

  const calculatePerformanceHistory = useCallback((performanceFunction) => {
    // Calculate the historical machine utilization for each machine selected in the date range
    let currentDate = dayjs(dateSelection[0]);
    const endDate = dayjs(dateSelection[1]);
    const performanceHistory = [];

    // Loop through each day in the date range and calculate the machine utilization
    while (currentDate.isSameOrBefore(endDate)) {
      // Use the filterData function for the current date
      const filteredDN = dailyNumbers.filter((dn) => { return dayjs(dn.Date, 'DD-MM-YYYY').isSame(currentDate); });
      const filteredSR = stopRegistrations.filter((sr) => { return dayjs(sr.Date, 'DD-MM-YYYY').isSame(currentDate); });

      const performance = performanceFunction(filteredDN, filteredSR, orders, 'history');

      // Create an object with the date and the machine utilizations as properties
      const performanceObj = {
        Date: currentDate.format('DD-MM-YYYY'),
      };

      performance.forEach((obj) => {
        performanceObj[obj.id] = parseFloat(obj.performance);
      });

      // Add the utilization object for the current date to the machineUtilizationHistory array
      performanceHistory.push(performanceObj);

      // Increment the date by 1 day
      currentDate = currentDate.add(1, 'day');
    }
    return performanceHistory;
  }, [dateSelection, dailyNumbers, orders, stopRegistrations]);

  const calculateStopsByReason = useCallback(() => {
    const stopsByReason = filteredStopRegistrations.reduce((acc, sr) => {
      // No need to check for machine and P-order as it's already filtered
      acc[sr.Reason] = (acc[sr.Reason] || 0) + 1;
      return acc;
    }, {});

    const stopsByReasonList = Object.entries(stopsByReason)
      .map(([reason, value]) => {
        return { reason, value };
      })
      .sort((a, b) => b.value - a.value);

    return stopsByReasonList;
  }, [filteredStopRegistrations]);

  const calculateStopTimeByReason = useCallback(() => {

    const stopTimeByReason = filteredStopRegistrations.reduce((acc, sr) => {
      // No need to check for machine and P-order as it's already filtered
      const stopTime = getProductionTime(sr.Start_time, sr.End_time);
      acc[sr.Reason] = (acc[sr.Reason] || 0) + stopTime;
      return acc;
    }, {});

    const stopTimeByReasonList = Object.entries(stopTimeByReason)
      .map(([reason, value]) => {
        return { reason, value };
      })
      .sort((a, b) => b.value - a.value);

    return stopTimeByReasonList;
  }, [filteredStopRegistrations]);

  const calculateTotalProducedParts = useCallback(() => {

    const totalProducedParts = filteredDailyNumbers.reduce((acc, dn) => {
      // No need to check for machine and P-order as it's already filtered
      acc += parseInt(dn.Produced_parts, 10);
      return acc;
    }, 0);

    return totalProducedParts;
  }, [filteredDailyNumbers]);

  const calculateTotalDiscardedParts = useCallback(() => {
    const totalDiscardedParts = filteredDailyNumbers.reduce((acc, dn) => {
      // No need to check for machine and P-order as it's already filtered
      acc += parseInt(dn.Discarded_parts, 10);
      return acc;
    }, 0);

    return totalDiscardedParts;
  }, [filteredDailyNumbers]);

  const calculateTotalProducedTime = useCallback(() => {
    const totalProducedTime = filteredDailyNumbers.reduce((acc, dn) => {
      // No need to check for machine and P-order as it's already filtered
      const producedTime = getProductionTime(dn.Production_Start_time, dn.Production_End_time);
      acc += producedTime;
      return acc;
    }, 0);

    return totalProducedTime;
  }, [filteredDailyNumbers]);

  const calculateTotalStopTime = useCallback(() => {
    const totalStopTime = filteredStopRegistrations.reduce((acc, sr) => {
      // No need to check for machine and P-order as it's already filtered
      const stopTime = getProductionTime(sr.Start_time, sr.End_time);
      acc += stopTime;
      return acc;
    }, 0);

    return totalStopTime;
  }, [filteredStopRegistrations]);

  const calculateEffectiveProductionTime = useCallback(() => {
    const totalProducedTime = calculateTotalProducedTime();
    const totalStopTime = calculateTotalStopTime();

    const effectiveProductionTime = totalProducedTime - totalStopTime;

    return effectiveProductionTime;
  }, [calculateTotalProducedTime, calculateTotalStopTime]);

  const calculateTotalProducedPerHour = useCallback(() => {
    const totalProduced = calculateTotalProducedParts();

    const totalProducedTime = calculateEffectiveProductionTime();

    //Find the produced parts per hour and take the absolute value
    const producedPerHour = totalProducedTime > 0 ? Math.round(Math.abs(totalProduced / (totalProducedTime / 60))) : 0;

    return producedPerHour;
  }, [calculateEffectiveProductionTime, calculateTotalProducedParts]);

  const calculateTotalDiscardedPerHour = useCallback(() => {
    const totalDiscarded = calculateTotalDiscardedParts();

    const totalProducedTime = calculateEffectiveProductionTime();

    //Find the discarded parts per hour and take the absolute value
    const discardedPerHour = totalProducedTime > 0 ? Math.round(Math.abs(totalDiscarded / (totalProducedTime / 60))) : 0;

    return discardedPerHour;
  }, [calculateEffectiveProductionTime, calculateTotalDiscardedParts]);

  // Calculate the OEE
  const calculateOEE = useCallback(() => {
    const machineUtilizationList = calculateMachineUtilization();
    const machineQualityList = calculateMachineQuality();
    const machinePerformanceList = calculateMachinePerformance();

    const OEE = selectedMachines.map((machine) => {
      const machineUtilization = machineUtilizationList.find(
        (utilization) => utilization.id === machine.name
      ).utilization;

      const qualityRatio = machineQualityList.find((ratio) => ratio.id === machine.name).quality;

      const machinePerformance = machinePerformanceList.find(
        (performance) => performance.id === machine.name
      ).performance;

    
      const oee = (parseFloat(machineUtilization) *
        parseFloat(machinePerformance) *
        parseFloat(qualityRatio)) /
        10000;

      return {
        machineName: machine.name,
        OEE: oee.toFixed(1),
      };
    });

    return OEE;
  }, [filteredDailyNumbers, selectedMachines, selectedPOrders, calculateMachineUtilization, calculateMachineQuality, calculatePerformanceAverage]);



  const [allMachines, setAllMachines] = useState([]);
  const [allPOrders, setAllPOrders] = useState([]);
  const [allVarenummer, setAllVarenummer] = useState([]);




  // Initialize all possible options for each filter when component mounts
  useEffect(() => {
    // sort machines ascending using orderIndex
    const machinesSorted = machines.sort((a, b) => a.orderIndex - b.orderIndex);
    setAllMachines(machinesSorted);
    // sort orders descending using CreationDate
    const ordersSorted = orders.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));
    setAllPOrders(ordersSorted);
    setAllVarenummer([...new Set(ordersSorted.map((order) => order.Varenummer))]);
  }, [machines, orders]);


  const [parameterForMetrics, setParameterForMetrics] = useState({
    "index": "id",
    "utilizationCalculation": calculateVarenummerUtilization,
    "qualityCalculation": calculateVarenummerQuality,
    "performanceCalculation": calculateVarenummerPerformance,
    "selectedItems": selectedVarenummer,
    "selectedItemId": ""
  });
  const [categoriesForCharts, setCategoriesForCharts] = useState([]);
  useEffect(() => {
    if (
      parameterForMetrics.selectedItems.length === 0 &&
      selectedVarenummer.length > 0
    ) {
      setParameterForMetrics((prev) => ({
        ...prev,
        selectedItems: selectedVarenummer,
      }));
    }

    const categories = parameterForMetrics.selectedItems.map((item) => {
      if (parameterForMetrics.selectedItemId === "") {
        // If selectedItemId is empty, just return the item
        return item;
      } else {
        // If selectedItemId is not empty, return the property value
        return item[parameterForMetrics.selectedItemId];
      }
    });
    setCategoriesForCharts(categories);
  }, [
    filteredDailyNumbers,
    parameterForMetrics.selectedItemId,
    parameterForMetrics.selectedItems,
    selectedVarenummer,
    selectedMachines,
    selectedPOrders
  ]);


  /////////////////////////////////
  useEffect(() => {
    const utilization = parameterForMetrics.utilizationCalculation(filteredDailyNumbers, filteredStopRegistrations, orders, 'normal');
    setUtilization(utilization);
    const averageUtilization = calculateAverageUtilization(utilization);
    setAverageUtilization(averageUtilization);
    const utilizationHistory = calculateUtilizationHistory(parameterForMetrics.utilizationCalculation);
    setMachineUtilizationHistory(utilizationHistory);
    const ratio = parameterForMetrics.qualityCalculation(filteredDailyNumbers, orders, 'normal');
    setQualityRatio(ratio);
    const averageQualityRatio = calculateAverageQualityRatio(ratio);
    setAverageQualityRatio(averageQualityRatio);
    const qualityHistory = calculateQualityHistory(parameterForMetrics.qualityCalculation);
    setQualityRatioHistory(qualityHistory);
    const performance = parameterForMetrics.performanceCalculation(filteredDailyNumbers, filteredStopRegistrations, orders, 'normal');
    setPerformance(performance);
    const averagePerformance = calculatePerformanceAverage(performance);
    setAveragePerformance(averagePerformance);
    const performanceHistory = calculatePerformanceHistory(parameterForMetrics.performanceCalculation);
    setPerformanceHistory(performanceHistory);
    const stopsByReason = calculateStopsByReason();
    setStopsByReason(stopsByReason);
    const stopTimeByReason = calculateStopTimeByReason();
    setStopsByReasonInMinutes(stopTimeByReason);
    const totalProducedParts = calculateTotalProducedParts();
    setTotalProducedParts(totalProducedParts);
    const totalDiscardedParts = calculateTotalDiscardedParts();
    setTotalDiscardedParts(totalDiscardedParts);
    const productionTime = calculateTotalProducedTime();
    setTotalProductionTime(productionTime);
    const stopTime = calculateTotalStopTime();
    setTotalStopTime(stopTime);
    const effectiveProductionTime = calculateEffectiveProductionTime();
    setEffectiveProductionTime(effectiveProductionTime);
    const producedPerHour = calculateTotalProducedPerHour();
    setProducedPerHour(producedPerHour);
    const discardedPerHour = calculateTotalDiscardedPerHour();
    setDiscardedPerHour(discardedPerHour);

    const OEE = calculateOEE();
    setOEE(OEE);
  },
    [
      filteredDailyNumbers,
      filteredStopRegistrations,
      orders,
      parameterForMetrics,
      calculateAverageUtilization,
      calculateAverageQualityRatio,
      calculatePerformanceAverage,
      calculateUtilizationHistory,
      calculateQualityHistory,
      calculatePerformanceHistory,
      calculateStopsByReason,
      calculateStopTimeByReason,
      calculateTotalProducedParts,
      calculateTotalDiscardedParts,
      calculateTotalProducedTime,
      calculateTotalStopTime,
      calculateEffectiveProductionTime,
      calculateTotalProducedPerHour,
      calculateTotalDiscardedPerHour,
      calculateOEE
    ]);

  const toggleMachine = (machine) => {
    const index = selectedMachines.findIndex(
      (selectedMachine) => selectedMachine.id === machine.id
    );

    if (index === -1) {
      setSelectedMachines([...selectedMachines, machine]);
    } else {
      setSelectedMachines([
        ...selectedMachines.slice(0, index),
        ...selectedMachines.slice(index + 1),
      ]);
    }
  };

  const toggleAllMachines = () => {
    if (selectedMachines.length === allMachines.length) {
      setSelectedMachines([]);
    } else {
      setSelectedMachines(allMachines);
    }
  };

  const isMachineSelected = (machine) => {
    const isMachineSelected = selectedMachines.some(
      (selectedMachine) => selectedMachine.id === machine.id
    );
    return isMachineSelected;
  };

  const toggleOrder = (order) => {
    const index = selectedPOrders.findIndex(
      (selectedOrder) => selectedOrder.P_Order === order.P_Order
    );

    if (index === -1) {
      setSelectedPOrders([...selectedPOrders, order]);
    } else {
      setSelectedPOrders([
        ...selectedPOrders.slice(0, index),
        ...selectedPOrders.slice(index + 1),
      ]);
    }
  };

  const toggleAllOrders = () => {
    if (selectedPOrders.length === allPOrders.length) {
      setSelectedPOrders([]);
    } else {
      setSelectedPOrders(allPOrders);
    }
  };


  const isOrderSelected = (order) => {
    const isOrderSelected = selectedPOrders.some(
      (selectedOrder) => selectedOrder.P_Order === order.P_Order
    );
    return isOrderSelected;
  };

  const toggleVarenummer = (varenummer) => {
    const index = selectedVarenummer.findIndex(
      (selectedOrder) => selectedOrder === varenummer
    );

    if (index === -1) {
      setSelectedVarenummer([...selectedVarenummer, varenummer]);
    } else {
      setSelectedVarenummer([
        ...selectedVarenummer.slice(0, index),
        ...selectedVarenummer.slice(index + 1),
      ]);
    }
  };

  const toggleAllVarenummer = () => {
    if (selectedVarenummer.length === allVarenummer.length) {
      setSelectedVarenummer([]);
    } else {
      setSelectedVarenummer(allVarenummer);
    }
  };

  const isVarenummerSelected = (varenummer) => {
    const isVarenummerSelected = selectedVarenummer.some(
      (selectedOrder) => selectedOrder === varenummer
    );
    return isVarenummerSelected;
  };

  const percentageFormatter = (number) => {
    // Format the number to be on the form ##.# and take care of 0 case
    if (number === 0 || number === null) {
      return "0 %";
    }
    return Intl.NumberFormat("da-DK").format(number.toFixed(1)) + " %";
  };

  const stopTimeFormatter = (number) => {
    // Create a string with the number in minutes and in hours too
    const timeInHours = number / 60;

    // Format the string to be on the form ## minutes / ## hours 
    const timeInHoursString = Intl.NumberFormat("da-DK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(timeInHours);

    return Intl.NumberFormat("da-DK").format(number) + " min / " + timeInHoursString + " timer";
  };

  const numberFormatter = (number) => {
    return Intl.NumberFormat("da-DK").format(number);
  };

  const handleVarenummerClick = () => {
    setVarenummerActive(true);
    setPOrderActive(false);
    setMachineActive(false);
  };

  const handlePOrderClick = () => {
    setVarenummerActive(false);
    setPOrderActive(true);
    setMachineActive(false);
  };

  const handleMachineClick = () => {
    setVarenummerActive(false);
    setPOrderActive(false);
    setMachineActive(true);
  };

  const MultiSelectBoxItem = ({ value, text, onClick, isSelected }) => {
    const handleClick = () => {
      onClick(value);
    };

    const itemClass = isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-700';

    return (
      <button
        type="button"
        className={`w-full text-left px-4 py-2 text-sm ${itemClass}`}
        onClick={handleClick}
      >
        {text}
      </button>
    );
  };
  const [activeTab, setActiveTab] = useState("1");

  useEffect(() => {
    if (varenummerActive) {
      setParameterForMetrics({
        "index": "id",
        "utilizationCalculation": calculateVarenummerUtilization,
        "qualityCalculation": calculateVarenummerQuality,
        "performanceCalculation": calculateVarenummerPerformance,
        "selectedItems": selectedVarenummer,
        "selectedItemId": ""
      })
    }
    else if (pOrderActive) {
      setParameterForMetrics({
        "index": "id",
        "utilizationCalculation": calculatePOrderUtilization,
        "qualityCalculation": calculatePOrderQuality,
        "performanceCalculation": calculatePOrderPerformance,
        "selectedItems": selectedPOrders,
        "selectedItemId": "P_Order"
      })
    } else if (machineActive) {
      setParameterForMetrics({
        "index": "id",
        "utilizationCalculation": calculateMachineUtilization,
        "qualityCalculation": calculateMachineQuality,
        "performanceCalculation": calculateMachinePerformance,
        "selectedItems": selectedMachines,
        "selectedItemId": "name"
      })
    }
  }, [
    varenummerActive,
    pOrderActive,
    machineActive,
    selectedVarenummer,
    selectedPOrders,
    selectedMachines,
    calculateVarenummerUtilization,
    calculateVarenummerQuality,
    calculateVarenummerPerformance,
    calculatePOrderUtilization,
    calculatePOrderQuality,
    calculatePOrderPerformance,
    calculateMachineUtilization,
    calculateMachineQuality,
    calculateMachinePerformance,
  ]);

  const productionNumbersDictionary = [
    { "name": "Totalt antal producerede emner", "value": `${totalProducedParts} stk` },
    { "name": "Totalt antal kasserede emner", "value": `${totalDiscardedParts} stk` },
    { "name": "Total produktionstid", "value": `${totalProductionTime} min / ${(totalProductionTime / 60).toFixed(1)} t` },
    { "name": "Total stop tid", "value": `${totalStopTime} min / ${(totalStopTime / 60).toFixed(1)} t` },
    { "name": "Effektiv produktionstid", "value": `${effectiveProductionTime} min / ${(effectiveProductionTime / 60).toFixed(1)} t` },
    { "name": "Produceret per effektiv time", "value": `${producedPerHour} stk/t` },
    { "name": "Kasseret per effektiv time", "value": `${discardedPerHour} stk/t` }
  ];

  return (
    <div className='error-box'>
      {error && (
        <div className="error-message">
          An error occurred while fetching data. Please try again later.
        </div>
      )}
      <div className="dashboard-page">
        <div className="dashboard">
          <div className="dashboard-container-row">
            <div className="dashboard-container-column">
              <div className=''>
                <TabList
                  defaultValue={activeTab}
                  onValueChange={(value) => setActiveTab(value)}
                >
                  <Tab value="1" text="Ydelse" />
                  <Tab value="2" text="Kvalitet" />
                  <Tab value="3" text="Udnyttelse" />
                </TabList>
              </div>
              {activeTab === "1" ? (
                <div className="mt-6 dashboard-container-column">
                  <div className='metric-box-side-by-side'>
                    <div className='metric-box'>
                      <h2 className='metric-title'>Gennemsnits ydelse</h2>
                      <h3 className='metric-number'>{averagePerformance}%</h3>
                    </div>
                    <div className='metric-box'>
                      <h2 className='metric-title'>OEE</h2>
                      <h3 className='metric-number'>{(OEE.reduce((acc, item) => acc + parseFloat(item.OEE), 0) / OEE.length).toFixed(1)}%</h3>
                    </div>
                  </div>
                  <div className="dashboard-container-row">
                    <div className="mt-4 chart-container" style={{ width: "70%" }}>
                      <DashboardBarChart
                        title="Ydelse"
                        subtitle="Antal dele produceret per time"
                        data={performance}
                        index={parameterForMetrics.index}
                        categories={["performance"]}
                        formatter={percentageFormatter}
                      />
                    </div>
                    <div className="mt-4 list-container" style={{ width: "28%", marginLeft: "2%" }}>
                      <DashboardList productionNumbersDictionary={productionNumbersDictionary} />
                    </div>
                  </div>
                  <div className="chart-container" style={{ width: "100%" }}>
                    <h2 className='metric-title'>Ydelse over tid</h2>
                    <LineChart
                      key="performanceHistory"
                      className="mt-4"
                      data={performanceHistory}
                      index="Date"
                      categories={categoriesForCharts}
                      valueFormatter={percentageFormatter}
                      yAxisWidth={40}
                    />
                  </div>
                </div>
              ) :
                activeTab === "2" ? (
                  <div className="mt-6 dashboard-container-column">
                    <div className='metric-box-side-by-side'>
                      <div className='metric-box'>
                        <h2 className='metric-title'>Gennemsnits kvalitet</h2>
                        <h3 className='metric-number'>{averageQualityRatio}%</h3>
                      </div>
                      <div className='metric-box'>
                        <h2 className='metric-title'>OEE</h2>
                        <h3 className='metric-number'>{(OEE.reduce((acc, item) => acc + parseFloat(item.OEE), 0) / OEE.length).toFixed(1)}%</h3>
                      </div>
                    </div>
                    <div className="dashboard-container-row">
                      <div className="mt-4 chart-container" style={{ width: "75%" }}>
                        <DashboardBarChart
                          title="Kvalitet"
                          subtitle="Procentdel af total antal producerede dele, der er godkendt"
                          data={qualityRatio}
                          index={parameterForMetrics.index}
                          categories={["quality"]}
                          formatter={percentageFormatter}
                        />
                      </div>
                      <div className="mt-4 list-container" style={{ width: "23%", marginLeft: "2%" }}>
                        <DashboardList productionNumbersDictionary={productionNumbersDictionary} />
                      </div>
                    </div>
                    <div className="mt-4 chart-container" style={{ width: "100%" }}>
                      <h2 className='metric-title'>Kvalitet over tid</h2>
                      <LineChart
                        key="qualityHistory"
                        className="mt-6"
                        data={qualityRatioHistory}
                        index="Date"
                        categories={categoriesForCharts}
                        valueFormatter={percentageFormatter}
                        yAxisWidth={40} />
                    </div>
                  </div>
                ) : activeTab === "3" ? (
                  <div className="mt-6 dashboard-container-column">
                    <div className='metric-box-side-by-side'>
                      <div className='metric-box'>
                        <h2 className='metric-title'>Gennemsnits Udnyttelse</h2>
                        <h3 className='metric-number'>{averageUtilization}%</h3>
                      </div>
                      <div className='metric-box'>
                        <h2 className='metric-title'>OEE</h2>
                        <h3 className='metric-number'>{(OEE.reduce((acc, item) => acc + parseFloat(item.OEE), 0) / OEE.length).toFixed(1)}%</h3>
                      </div>
                    </div>
                    <div className="dashboard-container-row">
                      <div className="mt-4 chart-container" style={{ width: "75%" }}>
                        <DashboardBarChart
                          title="Udnyttelse"
                          subtitle="Procentdel af den samlede produktions tid, hvor maskinen ikke er stoppet"
                          data={utilization}
                          index={parameterForMetrics.index}
                          categories={["utilization"]}
                          formatter={percentageFormatter}
                        />
                      </div>
                      <div className="mt-4 list-container" style={{ width: "23%", marginLeft: "2%" }}>
                        <DashboardList productionNumbersDictionary={productionNumbersDictionary} />
                      </div>
                    </div>
                    <div className="mt-4 chart-container" style={{ width: "100%" }}>
                      <h2 className='metric-title'>Udnyttelse over tid</h2>
                      <LineChart
                        key="machineUtilizationHistory"
                        className="mt-6"
                        data={machineUtilizationHistory}
                        index="Date"
                        categories={categoriesForCharts}
                        valueFormatter={percentageFormatter}
                        yAxisWidth={40} />
                    </div>
                  </div>
                ) : null}
            </div>
          </div>
          <div className='top-margin-2'>
            <div className="container-row-center-30vh">
              <div className="container-column-center-25vh">
                <h2 className='metric-title'>Stop</h2>
                <h3 className='metric-subtitle'>
                  Antal stop for hver årsag
                </h3>
                <BarChart
                  className="mt-6"
                  data={stopsByReason}
                  index="reason"
                  categories={["value"]}
                  colors={["green"]}
                  valueFormatter={numberFormatter}
                  yAxisWidth={68}
                  showLegend={false} />
              </div>
              <div className="container-column-center-25vh">
                <h3 className='metric-subtitle'>
                  Tid brugt på stop for hver årsag
                </h3>
                <BarChart
                  className="mt-6"
                  data={stopsByReasonInMinutes}
                  index="reason"
                  categories={["value"]}
                  colors={["green"]}
                  valueFormatter={stopTimeFormatter}
                  yAxisWidth={75}
                  showLegend={false} />
              </div>
            </div>
          </div>
        </div>
        <div className="filter-container">
          <div className="filter-box">
            <div className="bottom-margin-2">
              <TabList
                className='tab-list'
                onValueChange={(value) => setParameterForMetrics(value)}
              >
                <Tab
                  className={`tab-item ${varenummerActive ? 'active-tab' : ''}`}
                  value={{
                    "index": "id",
                    "utilizationCalculation": calculateVarenummerUtilization,
                    "qualityCalculation": calculateVarenummerQuality,
                    "performanceCalculation": calculateVarenummerPerformance,
                    "selectedItems": selectedVarenummer,
                    "selectedItemId": ""
                  }}
                  text="Varenummer"
                  onClick={handleVarenummerClick} />
                <Tab
                  className={`tab-item ${pOrderActive ? 'active-tab' : ''}`}
                  value={{
                    "index": "id",
                    "utilizationCalculation": calculatePOrderUtilization,
                    "qualityCalculation": calculatePOrderQuality,
                    "performanceCalculation": calculatePOrderPerformance,
                    "selectedItems": selectedPOrders,
                    "selectedItemId": "P_Order"
                  }}
                  text="P-Ordre"
                  onClick={handlePOrderClick} />
                <Tab
                  className={`tab-item ${machineActive ? 'active-tab' : ''}`}
                  value={{
                    "index": "id",
                    "utilizationCalculation": calculateMachineUtilization,
                    "qualityCalculation": calculateMachineQuality,
                    "performanceCalculation": calculateMachinePerformance,
                    "selectedItems": selectedMachines,
                    "selectedItemId": "name"
                  }}
                  text="Maskine"
                  onClick={handleMachineClick} />
              </TabList>
            </div>
            <div className="individual-filter-box">
              <Text className="text-2xl font-bold">Varenummer</Text>
              <MultiSelectBox value={selectedVarenummer} onValueChange={setSelectedVarenummer}>
                <MultiSelectBoxItem
                  key="all"
                  value={allVarenummer} // Note this change
                  text="Alle"
                  onClick={toggleAllVarenummer}
                  isSelected={selectedVarenummer.length === allVarenummer.length} // Note this change
                />
                {allVarenummer.map((varenummer) => ( // Note this change
                  <MultiSelectBoxItem
                    key={varenummer}
                    value={varenummer}
                    text={varenummer}
                    onClick={toggleVarenummer}
                    isSelected={isVarenummerSelected(varenummer)}
                  />
                ))}
              </MultiSelectBox>
            </div>
            <div className="individual-filter-box">
              <Text className="text-2xl font-bold">Maskiner</Text>
              <MultiSelectBox value={selectedMachines} onValueChange={setSelectedMachines}>
                <MultiSelectBoxItem
                  key="all"
                  value={allMachines} // Note this change
                  text="Alle"
                  onClick={toggleAllMachines}
                  isSelected={selectedMachines.length === allMachines.length} // Note this change
                />
                {allMachines.map((machine) => ( // Note this change
                  <MultiSelectBoxItem
                    key={machine.id}
                    value={machine}
                    text={machine.name}
                    onClick={toggleMachine}
                    isSelected={isMachineSelected(machine)}
                  />
                ))}
              </MultiSelectBox>
            </div>
            <div className="individual-filter-box">
              <Text className="text-2xl font-bold">P-Ordre</Text>
              <MultiSelectBox value={selectedPOrders} onValueChange={setSelectedPOrders}>
                <MultiSelectBoxItem
                  key="all"
                  value={allPOrders} // Note this change
                  text="Alle"
                  onClick={toggleAllOrders}
                  isSelected={selectedPOrders.length === allPOrders.length} // Note this change
                />
                {allPOrders.map((order) => ( // Note this change
                  <MultiSelectBoxItem
                    key={order.P_Order}
                    value={order}
                    text={order.P_Order}
                    onClick={toggleOrder}
                    isSelected={isOrderSelected(order)}
                  />
                ))}
              </MultiSelectBox>
            </div>
            <div className="individual-filter-box">
              <Text className="text-2xl font-bold">Periode</Text>
              <DateRangePicker
                className="max-w-md mx-auto"
                value={dateSelection}
                onValueChange={setDateSelection}
                locale={da}
                dropdownPlaceholder="Vælg dato" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;