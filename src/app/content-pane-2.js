import boid_styles from "@/components/simulation/boids.module.css";

import Link from "next/link";
import Button from "@/components/general/Button";

import SectionTitle from "@/components/general/SectionTitle";
import Row_ImageLeft from "@/components/layout/Row_ImageLeft";
import Row_ImageRight from "@/components/layout/Row_ImageRight";
import RowContainer from "@/components/layout/RowContainer";

import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";
import space_race from "@/media/SpaceRaceName_BlackBG.png";
import asteroids from "@/media/Asteroids.png";
import logo_cs from "@/media/Csharp_Logo.png";
import logo_unity from "@/media/U_Logo_Black_RGB.png";
import logo_wpf from "@/media/wpf-logo.png";
import logo_excel from "@/media/excel-logo.png";
import logo_mongo from "@/media/mongo-green-logo.png";
import logo_react from "@/media/react-logo.png";
import RocketGame from "@/pages/games/rockets";

export default function ContentTwo(props) {
  return (
    <div className={boid_styles.boids_blocker}>
      <RowContainer>
        <SectionTitle title="Projects" />
        <Row_ImageRight
          image_size={100}
          image_src={asteroids}
          link="https://github.com/DaDevFox/Powertoys-Excel-Search/releases"
          title="Excel Search"
          description="Add-in to PowerToys Run utility which (fuzzy) searches Excel recent spreadsheets. Made in .NET C#."
          image_2
          image_2_width={50}
          image_2_height={50}
          image_2_src={logo_cs}
          image_3
          image_3_padding={10}
          image_3_width={60}
          image_3_height={50}
          image_3_src={logo_wpf}
        >
          <Link href={"https://github.com/DaDevFox/Powertoys-Excel-Search"}>
            <Button>Source</Button>
          </Link>
        </Row_ImageRight>
        <Row_ImageLeft
          image_size={100}
          image_src={logo_gh}
          link={"https://github.com/DaDevFox/testudo-tracker"}
          title="Testudo Tracker (WIP)"
          description="Web-based tracking client for UMD students to receive notifications on class seat availability and waitlist changes."
          image_2
          image_2_width={45}
          image_2_height={40}
          image_2_src={logo_react}
          image_3
          image_3_padding={10}
          image_3_width={150}
          image_3_height={50}
          image_3_src={logo_mongo}
        >
          <Link href={"https://github.com/DaDevFox/testudo-tracker"}>
            <Button>Source</Button>
          </Link>
        </Row_ImageLeft>
      </RowContainer>
    </div>
  );
}
