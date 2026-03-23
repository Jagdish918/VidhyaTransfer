import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0); // Explicitly scroll the root html tag
        document.body.scrollTo(0, 0); // Explicitly scroll the body tag
    }, [pathname, search]);

    return null;
};

export default ScrollToTop;
