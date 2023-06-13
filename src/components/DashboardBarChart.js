import { BarChart } from "@tremor/react";

function DashboardBarChart(props) {
    const data = props.data;
    const formatter = props.formatter;
    const title = props.title;
    const subtitle = props.subtitle;
    const index = props.index;
    const categories = props.categories;

    return (
        <><h2 className='metric-title'>
            {title}
        </h2>
            <h3 className='metric-subtitle'>
                {subtitle}
            </h3>
            <BarChart
                className="list-full-height"
                data={data}
                index={index}
                categories={categories}
                showLegend={false}
                valueFormatter={formatter}
                yAxisWidth={48} /></>
    )
}
export default DashboardBarChart;
