import Image from "next/image";
export default function Row_ImageRight(props) {
  return (
    <div className={"full_row"}>
      <div className={"left_wide"}>
        <div className={"panel"}>
          <p className={"title"}>{props.title}</p> <p> </p>
          {/* <ReactTyped
            startWhenVisible
            className={styles.title}
            strings={[props.title]}
            showCursor={false}
          /> */}
          <p className={"description"}>{props.description}</p>
        </div>
      </div>
      <div className={"right_narrow"}>
        <div className={"panel"}>
          <Image
            width={props.image_size}
            height={props.image_size}
            src={props.image_src}
            alt={props.image_alt}
            unoptimized // for now; followup on payment req
          />
        </div>
      </div>
    </div>
  );
}