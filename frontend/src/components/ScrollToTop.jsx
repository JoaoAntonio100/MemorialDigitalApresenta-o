import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname, search } = useLocation();
    const action = useNavigationType();

    useEffect(() => {

        if (action !== "POP") {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant"
            });
        }
    }, [pathname, search, action]);

    return null;
}