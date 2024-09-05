import styles from "@/styles/component.module.css";

import Image from "next/image";
import LeftPanel from "@/components/general/LeftPanel";
import RightPanel from "../general/RightPanel";

export default function Row_ImageRight(props) {
  return (
    <div className={styles.row}>
      <div>{props.children}</div>
      <div className={styles.rowInternalContainer}>
        <LeftPanel wide>
          <p className={styles.title}>{props.title}</p> <p> </p>
          <p className={"description"}>{props.description}</p>
          <div
            className={"links"}
            style={{
              maxHeight: Math.max(
                props.image_2_height ?? 30,
                props.image_3_height ?? 30,
                props.image_4_height ?? 30
              ),
            }}
          >
            {props.image_2 && (
              <Image
                style={{ padding: props.image_2_padding ?? 0 }}
                width={props.image_2_width ?? 30}
                height={props.image_2_height ?? 30}
                src={props.image_2_src}
                alt={props.image_2_alt}
              />
            )}
            {props.image_3 && (
              <Image
                style={{ padding: props.image_3_padding ?? 0 }}
                width={props.image_3_width ?? 30}
                height={props.image_3_height ?? 30}
                src={props.image_3_src}
                alt={props.image_3_alt}
              />
            )}
            {props.image_4 && (
              <Image
                style={{ padding: props.image_4_padding ?? 0 }}
                width={30}
                height={30}
                src={props.image_4_src}
                alt={props.image_4_alt}
              />
            )}
          </div>
        </LeftPanel>
        <RightPanel>
          <a href={props.image_link} className="row_image_a">
            <Image
              width={props.image_size}
              height={props.image_size}
              src={props.image_src}
              alt={props.image_alt}
              className={"row_image"}
              unoptimized // for now; followup on payment req
            />
          </a>
        </RightPanel>
      </div>
    </div>
  );
}
