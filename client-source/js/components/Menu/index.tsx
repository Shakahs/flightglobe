import * as React from 'react';
import {FontAwesomeIcon as FontAwesome} from "@fortawesome/react-fontawesome";

interface MenuProps {
    flightTableToggle: ()=>void
}

const Menu: React.SFC<MenuProps> = (props) => (
    <div className={'menuButton'}>
        <button
            onClick={props.flightTableToggle}
        >
            <FontAwesome icon='bars' size='lg' />
        </button>
    </div>
);

export default Menu;
