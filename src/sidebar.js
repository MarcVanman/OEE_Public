import './sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { View, Image } from '@aws-amplify/ui-react';

const Sidebar = () => {

    return (
        <div className="sidebar">
            <div className="logo">
                <View textAlign="left">
                    <Image
                        alt="Linimatic logo"
                        src="https://linimatic.eu/wp-content/uploads/2020/09/linimatic-logo-desktop.png"
                    />
                </View>
            </div>
            <ul className="sidebar-menu">
                <li className="sidebar-menu-item">
                    <button onClick={() => window.location.href = '/'}>
                        <span className="icon-margin"><FontAwesomeIcon icon={faClipboardList} /></span>
                        Registrering
                    </button>
                </li>
                <li className="sidebar-menu-item">
                    <button onClick={() => window.location.href = '/dashboard'}>
                        <span className="icon-margin"><FontAwesomeIcon icon={faChartLine} /></span>
                        Dashboard
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;