
import 'dayjs/locale/en-gb';
import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DropdownItem, Dropdown } from "@tremor/react";
import { Card, Text, Col } from "@tremor/react";


export default function addStop(stops) {

    const handleReasonChange = (value) => {
        {
            (value) => {
                const updatedStops = [...stops];
                updatedStops[index] = {
                    ...updatedStops[index],
                    stopReason: value,
                };
                setStops(updatedStops);
                inputIsGiven(value, setIsReasonChosen);
            }
        }
    }

    return stops.map((stop, index) => (
        <div key={stop.id} className="custom-grid-dynamic">
            <Text className='stop-registration'>
                Stop {index + 1}
            </Text>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
                <Col numColSpanLg={3}>
                    <Card>
                        <div className="register-time-form-container" style={{ 'textAlign': 'center' }}>
                            <div className='register-time-form-inner-container'>
                                <Text className='input-field-header'>Stop årsag</Text>
                                <Dropdown
                                    value={stop.stopReason}
                                    onValueChange={(value) => {
                                        const updatedStops = [...stops];
                                        updatedStops[index] = {
                                            ...updatedStops[index],
                                            stopReason: value,
                                        };
                                        setStops(updatedStops);
                                        inputIsGiven(value, setIsReasonChosen);
                                    }}
                                >
                                    <DropdownItem value="Omstilling " text={"Omstilling"} />
                                    <DropdownItem value="Manglende mandskab" text={"Manglende mandskab"} />
                                    <DropdownItem value="Planlagt stop" text={"Planlagt stop"} />
                                    <DropdownItem value="Opstart" text={"Opstart"} />
                                    <DropdownItem value="Nedlukning" text={"Nedlukning"} />
                                    <DropdownItem value="Andet" text={"Andet"} />
                                    <DropdownItem value="Form" text={"Form"} />
                                    <DropdownItem value="Stanseværktøj" text={"Stanseværktøj"} />
                                    <DropdownItem value="Robot" text={"Robot"} />
                                    <DropdownItem value="Maskine" text={"Maskine"} />
                                    <DropdownItem value="Hjælpeværktøj" text={"Hjælpeværktøj"} />
                                    <DropdownItem value="Køletunnel" text={"Køletunnel"} />
                                    <DropdownItem value="Proces" text={"Proces"} />
                                    <DropdownItem value="Procesafprøvning PRO" text={"Procesafprøvning PRO"} />
                                    <DropdownItem value="Procesafprøvning PTA" text={"Procesafprøvning PTA"} />
                                    <DropdownItem value="Fejl 40" text={"Fejl 40 ( menneskelige fejl)"} />
                                    <DropdownItem value="Smøring" text={"Smøring"} />
                                    <DropdownItem value="Form ikke klar" text={"Form ikke klar"} />
                                    <DropdownItem value="Manglende emner" text={"Manglende emner"} />
                                    <DropdownItem value="Manglende teknisk assistance" text={"Manglende teknisk assistance"} />
                                </Dropdown>
                            </div>
                        </div>
                        <div className='register-time-form-container'>

                            <Col numColSpanLg={2}>
                                <Stack direction="row" spacing={2}>
                                    <div className='register-time-form-inner-container' style={{ 'textAlign': 'center' }}>
                                        <Text className='input-field-header'>Tid</Text>
                                        <div className='time-container'>
                                            <div className='start-time'>
                                                <TimeField
                                                    className='time-inputbox'
                                                    label="Start tid for stop"
                                                    value={stops[index]?.startTime}
                                                    onChange={(value) => {
                                                        const updatedStops = [...stops];
                                                        const newStartTime = new Date(stops[index]?.startTime);
                                                        newStartTime.setHours(new Date(value).getHours());
                                                        newStartTime.setMinutes(new Date(value).getMinutes());
                                                        updatedStops[index] = {
                                                            ...updatedStops[index],
                                                            startTime: newStartTime,
                                                        };
                                                        setStops(updatedStops);
                                                    }}
                                                />
                                            </div>
                                            -
                                            <div className='end-time'>
                                                <TimeField
                                                    className='time-inputbox'
                                                    label="Slut tid for stop"
                                                    value={stops[index]?.endTime}
                                                    onChange={(value) => {
                                                        const updatedStops = [...stops];
                                                        const newEndTime = new Date(stops[index]?.endTime);
                                                        newEndTime.setHours(new Date(value).getHours());
                                                        newEndTime.setMinutes(new Date(value).getMinutes());
                                                        updatedStops[index] = {
                                                            ...updatedStops[index],
                                                            endTime: newEndTime,
                                                        };
                                                        setStops(updatedStops);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Stack>
                            </Col>
                        </div>
                    </Card>
                </Col>
            </LocalizationProvider>
        </div>
    ));
}