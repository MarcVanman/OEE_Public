import { Card } from "@tremor/react";

function DashboardList(props) {
    const productionNumbersDictionary = props.productionNumbersDictionary;
    return (
        <Card>
            <h2 className='metric-title'>Antal og Tid</h2>
            <div className='list-full-height'>
                {productionNumbersDictionary.map((item, index) => (
                    <div key={index} className='list-item'>
                        <span>{item.name}</span>
                        <span>{item.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
export default DashboardList;
