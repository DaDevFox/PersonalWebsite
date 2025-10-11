import layout_styles from "@/styles/layout.module.css";
import styles from "@/styles/component.module.css";
import Link from "next/link";

import SectionTitle from "@/components/general/SectionTitle";
import Row_ImageLeft from "@/components/layout/Row_ImageLeft";
import Row_ImageRight from "@/components/layout/Row_ImageRight";
import RowContainer from "@/components/layout/RowContainer";

import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";
import space_race from "@/media/SpaceRaceName_BlackBG.png";
import asteroids from "@/media/Asteroids.png";
import logo_cs from "@/media/Csharp_Logo.png";
import logo_unity from "@/media/U_Logo_Black_RGB.png";
import logo_cpp from "@/media/cpp_logo.png";
import logo_sdl from "@/media/SDL_logo.png";
import Button from "@/components/general/Button";

export default function ContactContent(props) {
  return (
    <div className={layout_styles.panel}>
      <RowContainer>
        <div className={styles.description}>
          <p style={{ padding: 10 }}>
            <strong>Get in touch</strong>:{" "}
            <a href="mailto:mehul.tahiliani@gmail.com">
              mehul.tahiliani@gmail.com
            </a>
          </p>
        </div>
      </RowContainer>
    </div>
  );
}
