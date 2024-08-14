export default function useOnScreen(ref) {
  const [isIntersecting, setIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) =>
        setIntersecting(entry.isIntersecting),
      ),
    [ref],
  );

  useEffect(() => {
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return isIntersecting;
}

// USAGE:
// const DummyComponent = () => {
//
//   const ref = useRef<HTMLDivElement>(null)
//   const isVisible = useOnScreen(ref)
//
//   return <div ref={ref}>{isVisible && `Yep, I'm on screen`}</div>
// }
//
